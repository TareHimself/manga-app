
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
    scaleTransformY: Animated.Value;
    scaleTransformX: Animated.Value;
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
    subViewRatio: number;
    previousZoom: number;
    currentZoomPivot: Vector2;
    lastPinchDistance: number;

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

        this.subViewRatio = .5;

        this.scaleTransformY = new Animated.Value(0);
        this.scaleTransformX = new Animated.Value(0);
        this.previousZoom = 1;
        this.currentZoomPivot = { x: -1, y: -1 }
        this.lastPinchDistance = 0;
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

        let scrollDeltaX = 0;//(gesture.vx * (this.scrollSpeed / currentZoom))
        let scrollDeltaY = 0;//(gesture.vy * (this.scrollSpeed / currentZoom))

        let currentX: number = (this.handlers.scrollX as any)._value;
        let currentY: number = (this.handlers.scrollY as any)._value;


        if (isZoom) {
            const finger1Screen = { x: event.nativeEvent.changedTouches[0].pageX, y: event.nativeEvent.changedTouches[0].pageY }
            const finger2Screen = { x: event.nativeEvent.changedTouches[1].pageX, y: event.nativeEvent.changedTouches[1].pageY }
            if (this.currentZoomPivot.x === -1) {
                const midpointScreenX = (this.mainViewLayout.width / 2);
                const midpointScreenY = (this.mainViewLayout.height / 2);

                const currentYUnscaled = Math.abs(currentY) / currentZoom;

                const currentXUnscaled = Math.abs(currentX) / currentZoom;
                console.log(currentXUnscaled, currentYUnscaled)

                this.lastPinchDistance = distanceBetween2Points(finger1Screen, finger2Screen);
                this.currentZoomPivot = {
                    x: midpointScreenX, y: midpointScreenY
                }//{ x: (this.mainViewLayout.width / 2), y: (this.mainViewLayout.height / 2) }
            }

            //{ x: ((finger1Screen.x + finger2Screen.x) / 2) + (Math.abs(currentX) / currentZoom), y: ((finger1Screen.y + finger2Screen.y) / 2) + (Math.abs(currentY) / currentZoom) }
            //{ x: this.mainViewLayout.width / 2, y: this.mainViewLayout.height / 2 }
            const distanceDelta = distanceBetween2Points(finger1Screen, finger2Screen) - this.lastPinchDistance;


            const newZoom = clamp(currentZoom + (distanceDelta / 100), this.zoomMin, 3);

            scrollDeltaX = (this.currentZoomPivot.x * currentZoom) - (this.currentZoomPivot.x * newZoom);

            scrollDeltaY = (this.currentZoomPivot.y * currentZoom) - (this.currentZoomPivot.y * newZoom);

            this.handlers.zoom.setValue(newZoom)
            this.lastPinchDistance = distanceBetween2Points(finger1Screen, finger2Screen);
        }
        else {
            this.currentZoomPivot = { x: -1, y: -1 }
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

        const subViewWidth = this.mainViewLayout.width * (this.handlers.zoom as any)._value;
        const subViewHeight = subViewWidth * this.subViewRatio;
        const xSpaceAvailable = Math.max(subViewWidth - this.mainViewLayout.width, 0);
        const ySpaceAvailable = Math.max(subViewHeight - this.mainViewLayout.height, 0);
        this.handlers.scrollX.setValue(clamp(newPositionX, xSpaceAvailable * -1, 0));
        this.handlers.scrollY.setValue(clamp(newPositionY, ySpaceAvailable * -1, 0));
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
        this.subViewRatio = event.nativeEvent.layout.height / event.nativeEvent.layout.width;
        this.computeScrollBarProperties();
    }

    onZoomChanged(state: { value: number }) {
        const originalWidth = this.mainViewLayout.width * this.zoomMin;
        const originalHeight = originalWidth * this.subViewRatio;

        const currentWidth = this.mainViewLayout.width * state.value;
        const currentHeight = currentWidth * this.subViewRatio;
        this.scaleTransformY.setValue(((currentHeight / 2) - (originalHeight / 2)) / state.value);
        this.scaleTransformX.setValue(((currentWidth / 2) - (originalWidth / 2)) / state.value);
    }

    componentDidMount() {

        this.dimensionsSubscription = Dimensions.addEventListener('change', (event) => {
            this.setState(state => ({
                windowHeight: event.window.height,
                windowWidth: event.window.width
            }));
        });

        this.animatedZoomListener = this.handlers.zoom.addListener(this.onZoomChanged.bind(this));

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
                        style={{ width: this.widthAnimated, maxWidth: this.widthAnimated, marginTop: this.handlers.scrollY, marginLeft: this.handlers.scrollX, transform: [{ scale: this.handlers.zoom }, { translateY: this.scaleTransformY }, { translateX: this.scaleTransformX }] }}
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