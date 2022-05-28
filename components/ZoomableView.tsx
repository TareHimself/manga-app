
import React, { useRef } from 'react'
import ReactNative, { StyleProp, ViewStyle, PanResponder, Animated, useWindowDimensions } from 'react-native';
import { clamp, distanceBetween2Points } from '../utils';

interface ZoomableViewProps { style?: StyleProp<ViewStyle>; scrollSpeed?: number; children?: React.ReactNode; zoomMin: number, zoomMax: number; }
export default function ZoomableView({ style, scrollSpeed, children, zoomMin, zoomMax }: ZoomableViewProps) {

    const minZoom = zoomMin || 1;
    const maxZoom = zoomMax || 3;
    const gestureMultiplier = scrollSpeed || 20;

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const hasStartedNewZoomCapture = useRef(true);

    const animatedScroll = useRef(new Animated.ValueXY()).current;

    const animatedWidth = useRef(new Animated.Value(windowWidth)).current;

    const latestLayoutInfo = useRef<ReactNative.LayoutRectangle>();

    const initialScale = useRef(0)

    const initialMidpoint = useRef({ x: 0, y: 0 });

    const initialPivotDistance = useRef({ x: 0, y: 0 });

    const lastPivotDelta = useRef({ x: 0, y: 0 });

    const midpointDelta = useRef({ x: 0, y: 0 });

    const zoomDistanceLastMove = useRef(0);

    function onLayoutAnimatedView(event: ReactNative.LayoutChangeEvent) {
        latestLayoutInfo.current = event.nativeEvent.layout;
    }

    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: (e, gestureState) => true,
            onStartShouldSetPanResponder: (e, gestureState) => true,
            onStartShouldSetPanResponderCapture: (e, gestureState) => true,
            onPanResponderRelease: (event, gesture) => {
                hasStartedNewZoomCapture.current = true;
            },
            onPanResponderTerminate: (event, gesture) => {
                hasStartedNewZoomCapture.current = true;
            },
            onPanResponderMove: (event, gesture) => {

                const currentWidth: number = (animatedWidth as any)._value;

                const isZoom = event.nativeEvent.changedTouches.length > 1;

                const scale = (currentWidth / windowWidth);

                let scrollDeltaX = (gesture.vx * (gestureMultiplier / scale))
                let scrollDeltaY = (gesture.vy * (gestureMultiplier / scale))

                let currentX: number = (animatedScroll.getLayout()['left'] as any)._value;
                let currentY: number = (animatedScroll.getLayout()['top'] as any)._value;

                if (isZoom) {
                    const finger1Screen = { x: event.nativeEvent.changedTouches[0].pageX, y: event.nativeEvent.changedTouches[0].pageY }
                    const finger2Screen = { x: event.nativeEvent.changedTouches[1].pageX, y: event.nativeEvent.changedTouches[1].pageY }


                    if (hasStartedNewZoomCapture.current) {

                        //const divSpaceMidpoint = { x: ((finger1DivSpace.x + finger2DivSpace.x) / 2), y: ((finger1DivSpace.y + finger2DivSpace.y) / 2) };

                        //initialDivSpaceMidpoint.current = divSpaceMidpoint;

                        const screenMidpointX = (windowWidth / 2);
                        const screenMidpointY = (windowHeight / 2);

                        initialMidpoint.current = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) };
                        initialPivotDistance.current = { x: screenMidpointX + Math.abs(currentX), y: screenMidpointY + Math.abs(currentY) }
                        midpointDelta.current = initialMidpoint.current;
                        initialScale.current = scale - minZoom;
                        zoomDistanceLastMove.current = distanceBetween2Points(finger1Screen, finger2Screen);
                        hasStartedNewZoomCapture.current = false;
                        console.log(initialMidpoint.current)
                    }



                    const distanceDelta = (distanceBetween2Points(finger1Screen, finger2Screen) - zoomDistanceLastMove.current);

                    zoomDistanceLastMove.current = distanceBetween2Points(finger1Screen, finger2Screen);

                    const newWidth = clamp(currentWidth + distanceDelta, windowWidth * minZoom, windowWidth * maxZoom);

                    animatedWidth.setValue(newWidth);



                    const newScale = ((animatedWidth as any)._value / windowWidth);

                    const scaleDelta = newScale - initialScale.current;

                    const newMidpoint = { x: (initialMidpoint.current.x * scaleDelta), y: (initialMidpoint.current.y * scaleDelta) }

                    const scrollOffsetX = (initialPivotDistance.current.x - (initialPivotDistance.current.x * scaleDelta));

                    const scrollOffsetY = (initialPivotDistance.current.y - (initialPivotDistance.current.y * scaleDelta));

                    scrollDeltaX = scrollOffsetX - lastPivotDelta.current.x;
                    scrollDeltaY = scrollOffsetY - lastPivotDelta.current.y;

                    lastPivotDelta.current = { x: scrollOffsetX, y: scrollOffsetY }

                    console.log(scrollDeltaX, scrollDeltaY)
                }


                const newPositionX = currentX + scrollDeltaX;
                const newPositionY = currentY + scrollDeltaY;

                const { width, height } = latestLayoutInfo.current || { width: 0, height: 0 };

                const xSpaceAvailable = Math.min(windowWidth - width, 0);
                const ySpaceAvailable = Math.min(windowHeight - height, 0);

                const finalPositionX = clamp(newPositionX, xSpaceAvailable, 0);
                const finalPositonY = clamp(newPositionY, ySpaceAvailable, 0);
                const finalPosition = { x: finalPositionX, y: finalPositonY }
                animatedScroll.setValue(finalPosition);

            }
        })
    ).current;

    return (
        <Animated.View {...panResponder.panHandlers}
            style={[style, animatedScroll.getLayout(), { width: animatedWidth }]}
            onLayout={onLayoutAnimatedView}
        >

            {children}
        </Animated.View >
    )
}