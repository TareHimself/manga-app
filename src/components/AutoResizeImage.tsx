import { View, Text, Image, ImagePropTypes, ImageProps, ImageURISource } from 'react-native'
import React, { Attributes, useState } from 'react'

export default function AutoResizeImage({ source, style }: ImageProps) {

    const [ratio, setRatio] = useState(-1)

    function fixRatio() {
        const { uri } = source as ImageURISource;

        if (uri && ratio == -1) {
            Image.getSize(uri, (imgWidth, imgHeight) => {
                setRatio(imgWidth / imgHeight)
            }, (e) => {
                fixRatio
            })
        }
    }

    return (
        <Image source={source} onLoadEnd={fixRatio} style={{ ...style as Object, aspectRatio: (ratio === -1 ? 1 : ratio) }} />
    )
}