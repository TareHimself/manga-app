import { JSXElement } from "@babel/types";
import React from "react";
import { FlatList, ScrollView, StyleProp, View, ViewStyle } from "react-native";

export default function FlexGridView({ styleY, styleX, columns, items, createElement }: { styleY?: StyleProp<ViewStyle>; styleX?: StyleProp<ViewStyle>; columns: number; items: any[]; createElement: (element: any) => JSX.Element; }) {

    let rowCounter = 0;

    let elements: JSX.Element[] = [];

    let currentElements: JSX.Element[] = [];

    items.map((item, index) => {

        currentElements.push(createElement(item));

        if (currentElements.length === columns || index === items.length - 1) {
            elements.push(<View key={`row-${rowCounter}`} style={styleX}>{currentElements.map(element => element)}</View>)
            currentElements = [];
            rowCounter++;
        }
    });

    return (<ScrollView style={styleY}>
        {elements}
    </ScrollView>)
}