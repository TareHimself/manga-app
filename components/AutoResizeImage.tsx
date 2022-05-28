import { View, Text, Image, ImagePropTypes, ImageProps, ImageURISource } from 'react-native'
import React, { Attributes, useState } from 'react'

export default function AutoResizeImage({ source, style }: ImageProps) {

    const [ratio, setRatio] = useState(1)

    const { uri } = source as ImageURISource;
    if (uri) {
        Image.getSize(uri, (imgWidth, imgHeight) => {
            setRatio(imgWidth / imgHeight)
        })
    }

    return (
        <Image source={source} style={{ ...style as Object, aspectRatio: ratio }} />
    )
}