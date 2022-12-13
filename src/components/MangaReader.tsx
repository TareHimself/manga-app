import React, { useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ViewProps } from './Themed';

export type MangaReaderNavigation = 'info' | 'next' | 'previous';
export default function MangaReader({ images, onNavigate, style }: ViewProps & { images: string[], onNavigate: (op: MangaReaderNavigation) => Promise<void>; }) {

	const [webviewHeight, setWebviewHeight] = useState(Dimensions.get('window').height)
	const deviceWidth = Dimensions.get('window').width;
	const isProcessing = useRef(false);

	const onWebViewMessage = async (event: WebViewMessageEvent) => {
		const message: { op: string, data: string } = JSON.parse(event.nativeEvent.data);
		if (message.op === 'height') {
			//setWebviewHeight(Number(message.data));
		}
		else if (message.op === 'nav' && !isProcessing.current) {
			isProcessing.current = true;
			await onNavigate(message.data as MangaReaderNavigation);
			isProcessing.current = false;
		}
		else {
			console.log("UNAMED WEBVIEW MESSAGE", message.data)
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
		background-color: #1f1f1f;
		margin: 0;
	}

	img {
		max-width: 100%;
		height: auto;
	}

	#img-container {
		display: flex;
		flex-direction: column;
		height: fit-content;
		width: 100%;
		margin: 0;
	}

	#interaction-container {
		position: absolute;
		width: 100%;
		display: flex;
		justify-content: space-evenly;
		opacity: .3;
	}

	#interaction-container button {
		flex: 1;
		margin: 0;
		background-color: transparent;
		border: transparent;
	}

	@keyframes rotate-icon {
		from {
			transform: rotate(0deg);
		}

		25% {
			transform: rotate(90deg);
		}

		50% {
			transform: rotate(180deg);
		}

		75% {
			transform: rotate(270deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

	svg {
		width: 30%;
		margin: 0 auto;
		height: auto;
		animation: rotate-icon .8s linear infinite;
	}

	svg path {
		fill: white;
	}
</style>

<body>

	<script>
		function fixHeight() {
			const target = document.getElementById('interaction-container');
			const parent = document.getElementById('img-container');
			if (target) {
				target.style.height = Math.max(parent.getBoundingClientRect().height, window.innerHeight);
			}
		}

		function onButtonClicked(e) {
			const msg = e.target.getAttribute('data-msg') || '';
			window.ReactNativeWebView.postMessage(JSON.stringify({ op: 'nav' , data: msg})); 
		}
	</script>

	<div id="img-container">
		<div id="interaction-container" style="height: 100vh;">
			<button data-msg="previous" onclick="onButtonClicked(event)"></button>
			<button data-msg='info' onclick="onButtonClicked(event)"></button>
			<button data-msg='next' onclick="onButtonClicked(event)"></button>
		</div>

	</div>

	<script>
		function addImages(items) {
			const target = document.getElementById('img-container');
			items.forEach((url, idx) => {
				const newImg = new Image();
				const loader = \`<svg version="1.1" id="loader-\${idx}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
			x="0px" y="0px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;"
			xml:space="preserve">
			<path fill="#000"
				d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z">
			</path>
		</svg>\`
				
				target.innerHTML = target.innerHTML + loader
				newImg.onload = () => {
					const loaderElement = document.getElementById(\`loader-\${idx}\`)

					loaderElement.parentNode.replaceChild(newImg, loaderElement)
					fixHeight()
				}

				newImg.src = url

				
			})
		}

		addImages([${images.reduce((t, i, idx) => t + `"${i}"${idx === images.length - 1 ? '' : ','}`, "")}])
	</script>
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
}
