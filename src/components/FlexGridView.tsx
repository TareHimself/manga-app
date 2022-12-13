import React from "react";
import { ScrollView, View } from "react-native";
import { FlexGridViewProps } from "../types";

export default function FlexGridView({ listStyle, rowStyle, incompleteRowStyle, columns, items, createElement }: FlexGridViewProps) {

    let rowCounter = 0;

    let elements: JSX.Element[] = [];

    let currentElements: JSX.Element[] = [];

    items.map((item, index) => {

        currentElements.push(createElement(item));

        if (currentElements.length === columns || index === items.length - 1) {
            if (currentElements.length < columns) {
                elements.push(<View key={`row-${rowCounter}`} style={incompleteRowStyle}>{currentElements.map(element => element)}</View>)
            }
            else {
                elements.push(<View key={`row-${rowCounter}`} style={rowStyle}>{currentElements.map(element => element)}</View>)
            }

            currentElements = [];
            rowCounter++;
        }
    });

    return (<ScrollView style={listStyle}>
        {elements}
    </ScrollView>)
}