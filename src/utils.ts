import { Dimensions } from "react-native";

export function getDiagonalScreenSize() {
    const { width, height } = Dimensions.get('screen');

    return Math.sqrt((width ** 2) + (height ** 2)) / 160;
}

// this is a test comment 

export function isTablet(): boolean {

    return getDiagonalScreenSize() > 7;
}

export function clamp(a: number, min: number, max: number) {
    return Math.min(Math.max(a, min), max);
}

export function distanceBetween2Points(a: { x: number, y: number }, b: { x: number, y: number }) {
    return Math.sqrt((Math.pow(a.x - b.x, 2)) + (Math.pow(a.y - b.y, 2)))
}