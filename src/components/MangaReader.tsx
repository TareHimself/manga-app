import { View, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ViewProps } from './Themed';

export type MangaReaderNavigation = 'info' | 'next' | 'previous';
export default function MangaReader({ images, onNavigate, style }: ViewProps & { images: string[], onNavigate: (op: MangaReaderNavigation) => void; }) {

	const [webviewHeight, setWebviewHeight] = useState(Dimensions.get('window').height)
	const deviceWidth = Dimensions.get('window').width;

	const onWebViewMessage = (event: WebViewMessageEvent) => {
		const message: { op: string, data: string } = JSON.parse(event.nativeEvent.data);
		if (message.op === 'height') {
			//setWebviewHeight(Number(message.data));
		}
		else if (message.op === 'nav') {
			onNavigate(message.data as MangaReaderNavigation);
		}

	}

	const webViewScript = `
  setTimeout(function() { 
    window.ReactNativeWebView.postMessage(JSON.stringify({ op: 'height' , data: document.body.scrollHeight})); 
  }, 500);
  true; // note: this is required, or you'll sometimes get silent failures
`;
	return (
		<View>
			<WebView
				onMessage={onWebViewMessage}
				style={[{
					flex: 1,
					width: deviceWidth,
					height: webviewHeight
				}, style]} ignoreSslError={true} source={{
					html: `<html lang="en">

<head>
	<meta name="description" content="Webpage description goes here" />
	<meta charset="utf-8">
	<title>Manga</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, user-scalable=1">
	<meta name="author" content="">
	<link rel="stylesheet" href="css/style.css">
	<script src="http://code.jquery.com/jquery-latest.min.js"></script>
</head>

<style>
	body {
		display: flex;
		flex-direction: column;
		height: fit-content;
		background-color: transparent;
		margin: 0;
	}

	img {
		max-width: 100%;
		height: auto;
	}

	#imgContainer {
		display: flex;
		flex-direction: column;
		height: fit-content;
		width: 100%;
		margin: 0;
	}

	#interactionContainer {
		position: absolute;
		width: 100%;
		display: flex;
		justify-content: space-evenly;
		opacity: .3;
	}

	#interactionContainer button {
		flex: 1;
		margin: 0;
		background-color: transparent;
		border: transparent;
	}
</style>

<body>
	<script>
		function fixHeight() {
			const target = document.getElementById('interactionContainer');
			const parent = document.getElementById('imgContainer');
			if (target) {
				target.style.height = parent.getBoundingClientRect().height;
			}
		}

		function onButtonClicked(e) {
			const msg = e.target.getAttribute('data-msg') || '';
			window.ReactNativeWebView.postMessage(JSON.stringify({ op: 'nav' , data: msg}));
		}
	</script>
	<div id="imgContainer">
		<div id="interactionContainer">
			<button data-msg="previous" onclick="onButtonClicked(event)"></button>
			<button data-msg='info' onclick="onButtonClicked(event)"></button>
			<button data-msg='next' onclick="onButtonClicked(event)"></button>
		</div>
        ${images.map(src => `<img onload="fixHeight()"src='${src}'>`)}
	</div>

</body>

</html>` }} originWhitelist={['*']}
				allowUniversalAccessFromFileURLs
				javaScriptEnabled={true}
				domStorageEnabled={true}
				startInLoadingState={false}

				injectedJavaScript={webViewScript}
			/>

		</View>

	);
	//return (
	//     <Image progressiveRenderingEnabled={true} onLoad={onLoad} source={{ uri: imageLoaded }} style={{ ...style as Object, aspectRatio: (ratio ? ratio : 0.69), tintColor: isLoading ? 'black' : undefined }} />
	//)

	//${images.map(src => `<img src='${src}'>`)}
}