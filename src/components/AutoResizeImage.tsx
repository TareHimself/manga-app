import { View, Text, Image, ImagePropTypes, ImageProps, ImageURISource, Animated, LayoutChangeEvent, LayoutRectangle, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { Attributes, useRef, useState } from 'react'
import useMounted from '../hooks/useMounted';

const AnimatedLoading = Animated.createAnimatedComponent(ActivityIndicator);

export default function AutoResizeImage({ source, style }: ImageProps) {

    const [ratio, setRatio] = useState<undefined | number>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const iconMarginOffset = useRef(new Animated.Value(-10)).current;
    const iconTranslationOffset = useRef(new Animated.Value(-10)).current;
    const lastWidth = useRef(0);

    const IsMounted = useMounted();

    function fixRatio() {
        const { uri } = source as ImageURISource;

        if (uri && !ratio) {
            Image.getSize(uri, (imgWidth, imgHeight) => {
                if (IsMounted()) {
                    const newRatio = imgWidth / imgHeight;
                    setRatio(newRatio)
                    setIsLoading(false);
                }
            }, (e) => {
                console.log('failed to get image size, trying again')
                fixRatio();
            })
        }
    }

    function onLoad() {

    }


    return (
        <View style={{ flexDirection: 'column', alignContent: 'center', width: '100%', aspectRatio: (ratio ? ratio : 0.69), marginVertical: 5 }}>

            <Image onLoad={onLoad} source={source} onLoadEnd={fixRatio} style={{ ...style as Object, aspectRatio: (ratio ? ratio : 0.69), tintColor: isLoading ? 'black' : undefined }} />
        </View>
    )
}