
import React from 'react';
import ReactNative, { Animated, Dimensions, PanResponder, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Vector2 } from '../types';
import { clamp, distanceBetween2Points } from '../utils';

export interface ZoomableViewHandlers { scrollX: Animated.Value; scrollY: Animated.Value; zoom: Animated.Value }
export interface ZoomableViewProps { style?: StyleProp<ViewStyle>; scrollSpeed?: number; children?: React.ReactNode; zoomMin: number, zoomMax: number; touchMsTimeout?: number; onTouched?: (e: ReactNative.GestureResponderEvent, gestureState: ReactNative.PanResponderGestureState, handlers: ZoomableViewHandlers) => void; }
interface ZoomableViewState { windowWidth: number; windowHeight: number };

export default class ZoomableView extends React.Component<ZoomableViewProps, ZoomableViewState>  {
    panResponder: null | ReactNative.PanResponderInstance;
    hasStartedNewZoomCapture: boolean;
    handlers: { scrollX: Animated.Value; scrollY: Animated.Value; zoom: Animated.Value; };
    widthAnimated: Animated.Value;
    overlayBottomMarginAnimated: Animated.Value;
    overlayHeightAnimated: Animated.Value;
    scrollBarHeightAnimated: Animated.Value;
    scrollBarBottomMarginAnimated: Animated.Value;
    scrollBarTopOffsetAnimated: Animated.Value;
    scrollBarOpacityAnimated: Animated.Value;
    fadeScrollBarAnimation: Animated.CompositeAnimation;
    scrollBarVisibilityTimeout: null | ReturnType<typeof setTimeout>;
    lastPanEventTime: number;
    zoomBeforeScaleStart: number;
    initialMidpoint: Vector2;
    initialPivotDistance: Vector2;
    lastPivotDelta: Vector2;
    midpointDelta: Vector2;
    zoomDistanceLastMove: number;
    lastTouchStartTime: number;
    lastScrollVelocity: Vector2;
    scrollVelocityTimeout: null | ReturnType<typeof setTimeout>;
    isComputingScrollVelocity: boolean;
    acumilatedMoveLastTouch: Vector2;
    zoomMin: number;
    zoomMax: number;
    scrollSpeed: number;
    touchTimeout: number;
    scrollDampening: number;
    mainViewLayout: ReactNative.LayoutRectangle;
    subViewLayout: ReactNative.LayoutRectangle;
    overlayViewLayout: ReactNative.LayoutRectangle;
    animatedZoomListener: null | string;
    dimensionsSubscription: null | ReactNative.EmitterSubscription;

    constructor(props: ZoomableViewProps) {
        super(props);
        this.zoomMin = props.zoomMin || 1;
        this.zoomMax = props.zoomMax || 3;
        this.scrollSpeed = props.scrollSpeed || 20;
        this.touchTimeout = props.touchMsTimeout || 100;
        this.scrollDampening = 100;

        this.hasStartedNewZoomCapture = true;
        this.handlers = { scrollX: new Animated.Value(0), scrollY: new Animated.Value(0), zoom: new Animated.Value(this.zoomMin) }
        this.widthAnimated = new Animated.Value(0);
        this.overlayBottomMarginAnimated = new Animated.Value(0);
        this.overlayHeightAnimated = new Animated.Value(0);
        this.scrollBarHeightAnimated = new Animated.Value(0);
        this.scrollBarBottomMarginAnimated = new Animated.Value(0);
        this.scrollBarTopOffsetAnimated = new Animated.Value(0);
        this.scrollBarOpacityAnimated = new Animated.Value(1);
        this.fadeScrollBarAnimation = Animated.timing(this.scrollBarOpacityAnimated, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false
        });
        this.scrollBarVisibilityTimeout = null;
        this.lastPanEventTime = 0;
        this.zoomBeforeScaleStart = 0;
        this.initialMidpoint = { x: 0, y: 0 };
        this.initialPivotDistance = { x: 0, y: 0 };
        this.lastPivotDelta = { x: 0, y: 0 };
        this.midpointDelta = { x: 0, y: 0 };
        this.zoomDistanceLastMove = 0;
        this.lastTouchStartTime = 0;
        this.lastScrollVelocity = { x: 0, y: 0 };
        this.scrollVelocityTimeout = null;
        this.isComputingScrollVelocity = false;
        this.acumilatedMoveLastTouch = { x: 0, y: 0 };
        this.mainViewLayout = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.subViewLayout = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.overlayViewLayout = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.state = {
            windowWidth: 0,
            windowHeight: 0
        };

        this.dimensionsSubscription = null;
        this.animatedZoomListener = null

        this.panResponder = this.createResponder();
    }

    onScrollStart(event: ReactNative.GestureResponderEvent) {
        if (this.scrollVelocityTimeout !== null) {
            clearTimeout(this.scrollVelocityTimeout);
            this.scrollVelocityTimeout = null;
        }

        this.hasStartedNewZoomCapture = true;
        this.lastTouchStartTime = Date.now();
        this.lastPanEventTime = Date.now();
        this.lastScrollVelocity = { x: 0, y: 0 }
    }

    onScrollMove(event: ReactNative.GestureResponderEvent, gesture: ReactNative.PanResponderGestureState) {

        this.acumilatedMoveLastTouch = { x: this.acumilatedMoveLastTouch.x + Math.abs(gesture.vx), y: this.acumilatedMoveLastTouch.y + Math.abs(gesture.vy) };

        const now = Date.now();
        const deltaTime = (now - this.lastPanEventTime) / 1000;
        this.lastPanEventTime = now;

        const isZoom = event.nativeEvent.changedTouches.length > 1;

        const currentZoom: number = (this.handlers.zoom as any)._value;

        let scrollDeltaX = (gesture.vx * (this.scrollSpeed / currentZoom))
        let scrollDeltaY = (gesture.vy * (this.scrollSpeed / currentZoom))

        let currentX: number = (this.handlers.scrollX as any)._value;
        let currentY: number = (this.handlers.scrollY as any)._value;

        if (isZoom && false) {
            const finger1Screen = { x: event.nativeEvent.changedTouches[0].pageX, y: event.nativeEvent.changedTouches[0].pageY }
            const finger2Screen = { x: event.nativeEvent.changedTouches[1].pageX, y: event.nativeEvent.changedTouches[1].pageY }

            const finger1Element = { x: event.nativeEvent.changedTouches[0].locationX, y: event.nativeEvent.changedTouches[0].locationY }
            const finger2Element = { x: event.nativeEvent.changedTouches[1].locationX, y: event.nativeEvent.changedTouches[1].locationY }

            //{ x: (finger1Element.x + finger2Element.x) / 2, y: (finger1Element.y + finger2Element.y) / 2 }


            if (this.hasStartedNewZoomCapture) {

                const screenMidpointX = (this.state.windowWidth / 2);
                const screenMidpointY = (this.state.windowHeight / 2);

                this.initialMidpoint = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) };
                this.initialPivotDistance = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) }
                this.midpointDelta = this.initialMidpoint;
                this.zoomBeforeScaleStart = currentZoom;
                this.zoomDistanceLastMove = distanceBetween2Points(finger1Screen, finger2Screen);
                this.hasStartedNewZoomCapture = false;
            }



            const distanceDelta = (distanceBetween2Points(finger1Screen, finger2Screen) - this.zoomDistanceLastMove);

            this.zoomDistanceLastMove = distanceBetween2Points(finger1Screen, finger2Screen);

            const newZoom = clamp(currentZoom + (distanceDelta / 100), this.zoomMin, this.zoomMax);

            this.handlers.zoom.setValue(newZoom);

            const scaleDelta = newZoom - this.zoomBeforeScaleStart;

            const newMidpoint = { x: (this.initialMidpoint.x * scaleDelta), y: (this.initialMidpoint.y * scaleDelta) }

            const scrollOffsetX = (this.initialPivotDistance.x - (this.initialPivotDistance.x * scaleDelta));

            const scrollOffsetY = (this.initialPivotDistance.y - (this.initialPivotDistance.y * scaleDelta));

            scrollDeltaX = scrollOffsetX - this.lastPivotDelta.x;
            scrollDeltaY = scrollOffsetY - this.lastPivotDelta.y;

            this.lastPivotDelta = { x: scrollOffsetX, y: scrollOffsetY }

        }


        this.applyScrollDelta(scrollDeltaX, scrollDeltaY);
        this.computeScrollBarProperties();

    }

    onScrollEnd(event: ReactNative.GestureResponderEvent, gesture: ReactNative.PanResponderGestureState) {
        /*Animated.timing(scrollHandler, {
            toValue: { x: 0, y: 0 },
            duration: 100,
            useNativeDriver: false
        }).start();*/


        const distanceDelta = Math.max(this.acumilatedMoveLastTouch.x, this.acumilatedMoveLastTouch.y);
        const timeDelta = Date.now() - this.lastTouchStartTime

        if (distanceDelta < 10 && timeDelta < this.touchTimeout && this.props.onTouched) {
            this.props.onTouched(event, gesture, this.handlers);
        }
        else {

            console.log('no touch', (Date.now() - this.lastTouchStartTime), 'ms', distanceDelta)
            this.lastScrollVelocity = { x: gesture.vx * 20, y: gesture.vy * 20 };

            if (!this.isComputingScrollVelocity) {
                this.computeScrollVelocity();
            }

        }

        this.lastTouchStartTime = Date.now();

        this.acumilatedMoveLastTouch = { x: 0, y: 0 }
    }

    createResponder() {
        return PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: (e, gestureState) => true,
            onStartShouldSetPanResponder: (e, gestureState) => true,
            onStartShouldSetPanResponderCapture: (e, gestureState) => true,
            onPanResponderStart: this.onScrollStart.bind(this),
            onPanResponderMove: this.onScrollMove.bind(this),
            onPanResponderRelease: this.onScrollEnd.bind(this),
        });
    }

    applyScrollDelta(dx: number, dy: number) {
        const newPositionX = (this.handlers.scrollX as any)._value + dx;
        const newPositionY = (this.handlers.scrollY as any)._value + dy;

        const xSpaceAvailable = Math.min(this.state.windowWidth - this.subViewLayout.width, 0);
        const ySpaceAvailable = Math.min(this.mainViewLayout.height - this.subViewLayout.height, 0);

        this.handlers.scrollX.setValue(clamp(newPositionX, xSpaceAvailable, 0));
        this.handlers.scrollY.setValue(clamp(newPositionY, ySpaceAvailable, 0));
    }

    onScrollAnimated() {

    }

    computeScrollBarProperties() {

        this.fadeScrollBarAnimation.reset();
        this.scrollBarOpacityAnimated.setValue(1);

        const currentOffsetY = (this.handlers.scrollY as any)._value || 0;

        const currentHeight = (this.scrollBarHeightAnimated as any)._value || 50;
        const currentMargin = (this.scrollBarBottomMarginAnimated as any)._value || -50;

        const currentExtraSpace = currentHeight + currentMargin;

        const trueSubViewHeight = Math.max(this.subViewLayout.height - currentExtraSpace, 1);
        const trueMainViewHeight = Math.max(this.mainViewLayout.height, 1)
        const mainToSubRatio = (trueMainViewHeight / trueSubViewHeight);

        const scrollBarheight = Math.max((mainToSubRatio * this.mainViewLayout.height), 50);

        const finalBarOffset = ((currentOffsetY * - 1) * mainToSubRatio) + (currentOffsetY * -1);

        this.scrollBarHeightAnimated.setValue(scrollBarheight);
        this.scrollBarBottomMarginAnimated.setValue(scrollBarheight * -1);
        this.scrollBarTopOffsetAnimated.setValue(finalBarOffset);

        if (this.scrollBarVisibilityTimeout) {
            clearTimeout(this.scrollBarVisibilityTimeout);
        }

        setTimeout(() => {
            this.scrollBarVisibilityTimeout = null;
            this.fadeScrollBarAnimation.start();
        }, 2000);

    }

    computeScrollVelocity() {

        if (this.lastScrollVelocity.x === 0 && this.lastScrollVelocity.y === 0) {
            this.scrollVelocityTimeout = null;
            this.isComputingScrollVelocity = false;
            return;
        }
        else {
            this.isComputingScrollVelocity = true;
        }

        const now = Date.now();
        const deltaTime = (now - this.lastPanEventTime) / 1000;
        const reduction = deltaTime * this.scrollDampening;
        const currentVelocityX = this.lastScrollVelocity.x;
        const currentVelocityY = this.lastScrollVelocity.y;

        const newVelocityX = currentVelocityX !== 0 ? (currentVelocityX > 0 ? currentVelocityX - reduction : currentVelocityX + reduction) : 0;

        const newVelocityY = currentVelocityY !== 0 ? (currentVelocityY > 0 ? currentVelocityY - reduction : currentVelocityY + reduction) : 0;

        this.lastScrollVelocity = { x: (currentVelocityX * newVelocityX >= 0 ? newVelocityX : 0), y: (currentVelocityY * newVelocityY >= 0 ? newVelocityY : 0) };

        this.applyScrollDelta(newVelocityX, newVelocityY);
        this.lastPanEventTime = now;
        this.computeScrollBarProperties();
        setTimeout(this.computeScrollVelocity.bind(this), 10);

    }

    onMainViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        this.mainViewLayout = event.nativeEvent.layout;
        this.widthAnimated.setValue((this.handlers.zoom as any)._value * this.mainViewLayout.width)

    }

    onSubViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        if (this.subViewLayout.height !== event.nativeEvent.layout.height) {
            this.overlayHeightAnimated.setValue(event.nativeEvent.layout.height);
            this.overlayBottomMarginAnimated.setValue(event.nativeEvent.layout.height * -1);
        }
        this.subViewLayout = event.nativeEvent.layout;

        this.computeScrollBarProperties();
    }

    onZoomChanged(state: { value: number }) {
        //this.widthAnimated.setValue(state.value * this.mainViewLayout.width)
    }

    componentDidMount() {

        this.dimensionsSubscription = Dimensions.addEventListener('change', (event) => {
            this.setState(state => ({
                windowHeight: event.window.height,
                windowWidth: event.window.width
            }));
        });

        this.animatedZoomListener = this.handlers.zoom.addListener(this.onZoomChanged);

    }

    componentWillUnmount() {
        if (this.animatedZoomListener) {
            this.handlers.zoom.removeListener(this.animatedZoomListener);
            this.animatedZoomListener = null;
        }

        if (this.dimensionsSubscription) {
            this.dimensionsSubscription.remove();
            this.dimensionsSubscription = null;
        }

    }

    shouldComponentUpdate(nextProps: Readonly<ZoomableViewProps>, nextState: Readonly<ZoomableViewState>) {
        if (nextProps !== this.props) this.panResponder = this.createResponder();

        return true;
    }

    render() {
        if (!this.panResponder?.panHandlers) {
            return null;
        }

        return (
            <React.Fragment>

                <Animated.View
                    {...this.panResponder.panHandlers}
                    style={[this.props.style, styles.mainViewStyles]}
                    onLayout={this.onMainViewLayoutUpdated.bind(this)}
                >


                    <Animated.View
                        style={{ width: this.widthAnimated, maxWidth: this.widthAnimated, marginTop: this.handlers.scrollY }}
                        onLayout={this.onSubViewLayoutUpdated.bind(this)}
                    >

                        <Animated.View style={[styles.overlayViewStyles, { height: this.overlayHeightAnimated, marginBottom: this.overlayBottomMarginAnimated }]} />
                        <Animated.View style={[styles.scrollBarStyles, { top: this.scrollBarTopOffsetAnimated, height: this.scrollBarHeightAnimated, marginBottom: this.scrollBarBottomMarginAnimated, opacity: this.scrollBarOpacityAnimated }]} />
                        {this.props.children}

                    </Animated.View >
                </Animated.View>
            </React.Fragment>


        )

    }
}


const styles = StyleSheet.create({
    mainViewStyles: {
        flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden'
    },
    overlayViewStyles: {
        width: '100%',
        elevation: 2, zIndex: 2
    },
    scrollBarStyles: {
        width: 5,
        left: '100%',
        transform: [{ translateX: -10 }],
        elevation: 1, zIndex: 1,
        backgroundColor: 'rgba(80, 80, 80, 0.9)',
        borderRadius: 5
    }

})