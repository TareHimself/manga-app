
import React, { useRef } from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import ReactNative, { StyleProp, ViewStyle, PanResponder, Animated, useWindowDimensions, View } from 'react-native';
import { clamp, distanceBetween2Points } from '../utils';

export interface ZoomableViewHandlers { scrollX: Animated.Value; scrollY: Animated.Value; zoom: Animated.Value }
export interface ZoomableViewProps { style?: StyleProp<ViewStyle>; scrollSpeed?: number; children?: React.ReactNode; zoomMin: number, zoomMax: number; touchMsTimeout?: number; onTouched?: (e: ReactNative.GestureResponderEvent, gestureState: ReactNative.PanResponderGestureState, handlers: ZoomableViewHandlers) => void; }
export default function ZoomableView({ style, scrollSpeed, children, zoomMin, zoomMax, touchMsTimeout, onTouched }: ZoomableViewProps) {

    const minZoom = zoomMin || 1;
    const maxZoom = zoomMax || 3;
    const gestureMultiplier = scrollSpeed || 20;
    const functionalTouchTimeout = touchMsTimeout || 100

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const [newResponderIndex, setValueToChangeState] = useState(0);
    const hasStartedNewZoomCapture = useRef(true);

    const handlers = useRef<ZoomableViewHandlers>({ scrollX: new Animated.Value(0), scrollY: new Animated.Value(0), zoom: new Animated.Value(minZoom) }).current

    const widthAnimated = useRef(new Animated.Value(0)).current;

    const lastPanEventTime = useRef(0);

    const zoomBeforeScaleStart = useRef(0);

    const initialMidpoint = useRef({ x: 0, y: 0 });

    const initialPivotDistance = useRef({ x: 0, y: 0 });

    const lastPivotDelta = useRef({ x: 0, y: 0 });

    const midpointDelta = useRef({ x: 0, y: 0 });

    const zoomDistanceLastMove = useRef(0);

    const lastTouchStartTime = useRef(0);

    const lastScrollVelocity = useRef({ x: 0, y: 0 });

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

    function onMainViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        mainViewLayout.current = event.nativeEvent.layout;
        widthAnimated.setValue((handlers.zoom as any)._value * mainViewLayout.current.width)
    }

    function onSubViewLayoutUpdated(event: ReactNative.LayoutChangeEvent) {
        subViewLayout.current = event.nativeEvent.layout;

    }

    useEffect(() => {

        panResponder.current = PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: (e, gestureState) => true,
            onStartShouldSetPanResponder: (e, gestureState) => true,
            onStartShouldSetPanResponderCapture: (e, gestureState) => true,
            onPanResponderRelease: (event, gesture) => {
                /*Animated.timing(scrollHandler, {
                    toValue: { x: 0, y: 0 },
                    duration: 100,
                    useNativeDriver: false
                }).start();*/

                if ((Date.now() - lastTouchStartTime.current) < functionalTouchTimeout && onTouched) {
                    onTouched(event, gesture, handlers);
                }
                else {
                    console.log('no touch', (Date.now() - lastTouchStartTime.current), 'ms')
                }

                lastTouchStartTime.current = Date.now();
            },
            onPanResponderTerminate: (event, gesture) => {

            },
            onPanResponderStart: (event, gesture) => {
                hasStartedNewZoomCapture.current = true;
                lastTouchStartTime.current = Date.now();
                lastPanEventTime.current = event.timeStamp;
            }
            ,
            onPanResponderMove: (event, gesture) => {

                const deltaTime = (event.timeStamp - lastPanEventTime.current) / 1000;
                lastPanEventTime.current = event.timeStamp;

                const isZoom = event.nativeEvent.changedTouches.length > 1;

                const currentZoom: number = (handlers.zoom as any)._value;

                let scrollDeltaX = (gesture.vx * (gestureMultiplier / currentZoom))
                let scrollDeltaY = (gesture.vy * (gestureMultiplier / currentZoom))

                let currentX: number = (handlers.scrollX as any)._value;
                let currentY: number = (handlers.scrollY as any)._value;

                console.log(event.nativeEvent.changedTouches[0].locationY);

                if (isZoom) {
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


                const newPositionX = currentX + scrollDeltaX;
                const newPositionY = currentY + scrollDeltaY;


                const xSpaceAvailable = Math.min(windowWidth - subViewLayout.current.width, 0);
                const ySpaceAvailable = Math.min(mainViewLayout.current.height - subViewLayout.current.height, 0);

                handlers.scrollX.setValue(clamp(newPositionX, xSpaceAvailable, 0));
                handlers.scrollY.setValue(clamp(newPositionY, ySpaceAvailable, 0));
            }
        });
        console.log('Created new handler')
        setValueToChangeState(Date.now());

        function onZoomChanged(state: { value: number }) {
            widthAnimated.setValue(state.value * mainViewLayout.current.width)
        }

        const boundListner = handlers.zoom.addListener(onZoomChanged)

        return () => handlers.zoom.removeListener(boundListner);

    }, [gestureMultiplier, maxZoom, maxZoom, functionalTouchTimeout, onTouched])

    const panResponder = useRef<undefined | ReactNative.PanResponderInstance>(undefined);

    if (!panResponder.current?.panHandlers) {
        return null;
    }

    return (

        <Animated.View
            {...panResponder.current.panHandlers}
            style={[style, { flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden' }]}
            onLayout={onMainViewLayoutUpdated}
        >
            <Animated.View
                onMoveShouldSetResponder={(event: ReactNative.GestureResponderEvent) => { event.stopPropagation(); console.log(event.nativeEvent.target); return false; }}
                style={{ width: widthAnimated, marginTop: handlers.scrollY }}
                onLayout={onSubViewLayoutUpdated}
            >
                {children}
            </Animated.View >
        </Animated.View>

    )

}