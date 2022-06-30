
import React, { useEffect, useRef, useState } from 'react';
import ReactNative, { Animated, PanResponder, StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { clamp, distanceBetween2Points } from '../utils';

export interface ZoomableViewHandlers { scrollX: Animated.Value; scrollY: Animated.Value; zoom: Animated.Value }
export interface ZoomableViewProps { style?: StyleProp<ViewStyle>; scrollSpeed?: number; children?: React.ReactNode; zoomMin: number, zoomMax: number; touchMsTimeout?: number; onTouched?: (e: ReactNative.GestureResponderEvent, gestureState: ReactNative.PanResponderGestureState, handlers: ZoomableViewHandlers) => void; }
export default function ZoomableView({ style, scrollSpeed, children, zoomMin, zoomMax, touchMsTimeout, onTouched }: ZoomableViewProps) {

    const minZoom = zoomMin || 1;
    const maxZoom = zoomMax || 3;
    const gestureMultiplier = scrollSpeed || 20;
    const functionalTouchTimeout = touchMsTimeout || 100;
    const scrollDecelleration = 100;

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const [newResponderIndex, setValueToChangeState] = useState(0);
    const hasStartedNewZoomCapture = useRef(true);

    const handlers = useRef<ZoomableViewHandlers>({ scrollX: new Animated.Value(0), scrollY: new Animated.Value(0), zoom: new Animated.Value(minZoom) }).current

    const widthAnimated = useRef(new Animated.Value(0)).current;

    const overlayBottomMarginAnimated = useRef(new Animated.Value(0)).current;

    const overlayHeightAnimated = useRef(new Animated.Value(0)).current;

    const scrollBarHeightAnimated = useRef(new Animated.Value(50)).current;

    const scrollBarBottomMarginAnimated = useRef(new Animated.Value(-50)).current;

    const scrollBarTopOffsetAnimated = useRef(new Animated.Value(0)).current;

    const scrollBarOpacityAnimated = useRef(new Animated.Value(1)).current;

    const fadeScrollBarAnimation = useRef<Animated.CompositeAnimation>(Animated.timing(scrollBarOpacityAnimated, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false
    })).current;

    const scrollBarVisibilityTimeout = useRef<undefined | ReturnType<typeof setTimeout>>(undefined);

    const lastPanEventTime = useRef(0);

    const zoomBeforeScaleStart = useRef(0);

    const initialMidpoint = useRef({ x: 0, y: 0 });

    const initialPivotDistance = useRef({ x: 0, y: 0 });

    const lastPivotDelta = useRef({ x: 0, y: 0 });

    const midpointDelta = useRef({ x: 0, y: 0 });

    const zoomDistanceLastMove = useRef(0);

    const lastTouchStartTime = useRef(0);

    const lastScrollVelocity = useRef({ x: 0, y: 0 });

    const scrollVelocityTimeout = useRef<undefined | ReturnType<typeof setTimeout>>(undefined);

    const isComputingScrollVelocity = useRef(false);

    const acumilatedMoveLastTouch = useRef({ x: 0, y: 0 });




    function applyScrollDelta(dx: number, dy: number) {
        const newPositionX = (handlers.scrollX as any)._value + dx;
        const newPositionY = (handlers.scrollY as any)._value + dy;

        const xSpaceAvailable = Math.min(windowWidth - subViewLayout.current.width, 0);
        const ySpaceAvailable = Math.min(mainViewLayout.current.height - subViewLayout.current.height, 0);

        handlers.scrollX.setValue(clamp(newPositionX, xSpaceAvailable, 0));
        handlers.scrollY.setValue(clamp(newPositionY, ySpaceAvailable, 0));
    }

    function onScrollAnimated() {

    }

    function computeScrollBarProperties() {

        fadeScrollBarAnimation.reset();
        scrollBarOpacityAnimated.setValue(1);

        const currentOffsetY = (handlers.scrollY as any)._value || 0;

        const currentHeight = (scrollBarHeightAnimated as any)._value || 50;
        const currentMargin = (scrollBarBottomMarginAnimated as any)._value || -50;

        const currentExtraSpace = currentHeight + currentMargin;

        const trueSubViewHeight = Math.max(subViewLayout.current.height - currentExtraSpace, 1);
        const trueMainViewHeight = Math.max(mainViewLayout.current.height, 1)
        const mainToSubRatio = (trueMainViewHeight / trueSubViewHeight);

        const scrollBarheight = Math.max((mainToSubRatio * mainViewLayout.current.height), 50);


        const finalBarOffset = ((currentOffsetY * - 1) * mainToSubRatio) + (currentOffsetY * -1);

        scrollBarHeightAnimated.setValue(scrollBarheight);
        scrollBarBottomMarginAnimated.setValue(scrollBarheight * -1);
        scrollBarTopOffsetAnimated.setValue(finalBarOffset);

        if (scrollBarVisibilityTimeout.current) {
            clearTimeout(scrollBarVisibilityTimeout.current);
        }

        setTimeout(() => {
            scrollBarVisibilityTimeout.current = undefined;
            fadeScrollBarAnimation.start();
        }, 2000);

    }

    function computeScrollVelocity() {

        if (lastScrollVelocity.current.x === 0 && lastScrollVelocity.current.y === 0) {
            scrollVelocityTimeout.current = undefined;
            isComputingScrollVelocity.current = false;
            return;
        }
        else {
            isComputingScrollVelocity.current = true;
        }

        const now = Date.now();
        const deltaTime = (now - lastPanEventTime.current) / 1000;
        const reduction = deltaTime * scrollDecelleration;
        const currentVelocityX = lastScrollVelocity.current.x;
        const currentVelocityY = lastScrollVelocity.current.y;

        const newVelocityX = currentVelocityX !== 0 ? (currentVelocityX > 0 ? currentVelocityX - reduction : currentVelocityX + reduction) : 0;

        const newVelocityY = currentVelocityY !== 0 ? (currentVelocityY > 0 ? currentVelocityY - reduction : currentVelocityY + reduction) : 0;

        lastScrollVelocity.current = { x: (currentVelocityX * newVelocityX >= 0 ? newVelocityX : 0), y: (currentVelocityY * newVelocityY >= 0 ? newVelocityY : 0) };

        applyScrollDelta(newVelocityX, newVelocityY);
        lastPanEventTime.current = now;
        computeScrollBarProperties();
        setTimeout(computeScrollVelocity, 10);

    }

    const mainViewLayout = useRef({
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });

    const subViewLayout = useRef({
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });

    const overlayViewLayout = useRef({
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });

    function onMainViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        mainViewLayout.current = event.nativeEvent.layout;
        widthAnimated.setValue((handlers.zoom as any)._value * mainViewLayout.current.width)

    }

    function onSubViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        if (subViewLayout.current.height !== event.nativeEvent.layout.height) {
            overlayHeightAnimated.setValue(event.nativeEvent.layout.height);
            overlayBottomMarginAnimated.setValue(event.nativeEvent.layout.height * -1);
        }
        subViewLayout.current = event.nativeEvent.layout;

        computeScrollBarProperties();
    }

    useEffect(() => {

        panResponder.current = PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: (e, gestureState) => true,
            onStartShouldSetPanResponder: (e, gestureState) => true,
            onStartShouldSetPanResponderCapture: (e, gestureState) => true,
            onPanResponderStart: (event, gesture) => {
                if (scrollVelocityTimeout.current !== undefined) {
                    clearTimeout(scrollVelocityTimeout.current);
                    scrollVelocityTimeout.current = undefined;
                }

                hasStartedNewZoomCapture.current = true;
                lastTouchStartTime.current = Date.now();
                lastPanEventTime.current = Date.now();
                lastScrollVelocity.current = { x: 0, y: 0 }
            }
            ,
            onPanResponderMove: (event, gesture) => {

                acumilatedMoveLastTouch.current = { x: acumilatedMoveLastTouch.current.x + Math.abs(gesture.vx), y: acumilatedMoveLastTouch.current.y + Math.abs(gesture.vy) };

                const now = Date.now();
                const deltaTime = (now - lastPanEventTime.current) / 1000;
                lastPanEventTime.current = now;

                const isZoom = event.nativeEvent.changedTouches.length > 1;

                const currentZoom: number = (handlers.zoom as any)._value;

                let scrollDeltaX = (gesture.vx * (gestureMultiplier / currentZoom))
                let scrollDeltaY = (gesture.vy * (gestureMultiplier / currentZoom))

                let currentX: number = (handlers.scrollX as any)._value;
                let currentY: number = (handlers.scrollY as any)._value;

                if (isZoom && false) {
                    const finger1Screen = { x: event.nativeEvent.changedTouches[0].pageX, y: event.nativeEvent.changedTouches[0].pageY }
                    const finger2Screen = { x: event.nativeEvent.changedTouches[1].pageX, y: event.nativeEvent.changedTouches[1].pageY }

                    const finger1Element = { x: event.nativeEvent.changedTouches[0].locationX, y: event.nativeEvent.changedTouches[0].locationY }
                    const finger2Element = { x: event.nativeEvent.changedTouches[1].locationX, y: event.nativeEvent.changedTouches[1].locationY }

                    //{ x: (finger1Element.x + finger2Element.x) / 2, y: (finger1Element.y + finger2Element.y) / 2 }


                    if (hasStartedNewZoomCapture.current) {

                        const screenMidpointX = (windowWidth / 2);
                        const screenMidpointY = (windowHeight / 2);

                        initialMidpoint.current = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) };
                        initialPivotDistance.current = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) }
                        midpointDelta.current = initialMidpoint.current;
                        zoomBeforeScaleStart.current = currentZoom;
                        zoomDistanceLastMove.current = distanceBetween2Points(finger1Screen, finger2Screen);
                        hasStartedNewZoomCapture.current = false;
                    }



                    const distanceDelta = (distanceBetween2Points(finger1Screen, finger2Screen) - zoomDistanceLastMove.current);

                    zoomDistanceLastMove.current = distanceBetween2Points(finger1Screen, finger2Screen);

                    const newZoom = clamp(currentZoom + (distanceDelta / 100), minZoom, maxZoom);

                    handlers.zoom.setValue(newZoom);

                    const scaleDelta = newZoom - zoomBeforeScaleStart.current;

                    const newMidpoint = { x: (initialMidpoint.current.x * scaleDelta), y: (initialMidpoint.current.y * scaleDelta) }

                    const scrollOffsetX = (initialPivotDistance.current.x - (initialPivotDistance.current.x * scaleDelta));

                    const scrollOffsetY = (initialPivotDistance.current.y - (initialPivotDistance.current.y * scaleDelta));

                    scrollDeltaX = scrollOffsetX - lastPivotDelta.current.x;
                    scrollDeltaY = scrollOffsetY - lastPivotDelta.current.y;

                    lastPivotDelta.current = { x: scrollOffsetX, y: scrollOffsetY }

                }


                applyScrollDelta(scrollDeltaX, scrollDeltaY);
                computeScrollBarProperties();

            },
            onPanResponderRelease: (event, gesture) => {
                /*Animated.timing(scrollHandler, {
                    toValue: { x: 0, y: 0 },
                    duration: 100,
                    useNativeDriver: false
                }).start();*/


                const distanceDelta = Math.max(acumilatedMoveLastTouch.current.x, acumilatedMoveLastTouch.current.y);
                const timeDelta = Date.now() - lastTouchStartTime.current

                if (distanceDelta < 10 && timeDelta < functionalTouchTimeout && onTouched) {
                    onTouched(event, gesture, handlers);
                }
                else {

                    console.log('no touch', (Date.now() - lastTouchStartTime.current), 'ms', distanceDelta)
                    lastScrollVelocity.current = { x: gesture.vx * 20, y: gesture.vy * 20 };

                    if (!isComputingScrollVelocity.current) {
                        computeScrollVelocity();
                    }

                }

                lastTouchStartTime.current = Date.now();

                acumilatedMoveLastTouch.current = { x: 0, y: 0 }
            },
            onPanResponderTerminate: (event, gesture) => {

            }
        });

        setValueToChangeState(Date.now());

        function onZoomChanged(state: { value: number }) {
            widthAnimated.setValue(state.value * mainViewLayout.current.width)
        }

        const boundListner = handlers.zoom.addListener(onZoomChanged)

        return () => {
            handlers.zoom.removeListener(boundListner);
            if (scrollVelocityTimeout.current !== undefined) {
                clearTimeout(scrollVelocityTimeout.current);
                scrollVelocityTimeout.current = undefined;
            }
        };



    }, [gestureMultiplier, maxZoom, maxZoom, functionalTouchTimeout, onTouched])

    const panResponder = useRef<undefined | ReactNative.PanResponderInstance>(undefined);

    if (!panResponder.current?.panHandlers) {
        return null;
    }

    //
    return (
        <React.Fragment>

            <Animated.View
                {...panResponder.current.panHandlers}
                style={[style, styles.mainViewStyles]}
                onLayout={onMainViewLayoutUpdated}
            >


                <Animated.View
                    style={{ width: widthAnimated, maxWidth: widthAnimated, marginTop: handlers.scrollY }}
                    onLayout={onSubViewLayoutUpdated}
                >

                    <Animated.View style={[styles.overlayViewStyles, { height: overlayHeightAnimated, marginBottom: overlayBottomMarginAnimated }]} />
                    <Animated.View style={[styles.scrollBarStyles, { top: scrollBarTopOffsetAnimated, height: scrollBarHeightAnimated, marginBottom: scrollBarBottomMarginAnimated, opacity: scrollBarOpacityAnimated }]} />
                    {children}

                </Animated.View >
            </Animated.View>
        </React.Fragment>


    )

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
        width: 10,
        left: '100%',
        transform: [{ translateX: -15 }],
        elevation: 1, zIndex: 1,
        backgroundColor: 'rgba(80, 80, 80, 0.9)',
        borderRadius: 5
    }

})