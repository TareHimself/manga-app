import { Dimensions } from "react-native";
import axios from "axios";
import { encode } from "base64-arraybuffer";
import * as FileSystem from 'expo-file-system';

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

export function resolveAllPromises<T = any>(promises: Promise<T>[]) {
    return new Promise<T[]>((resolve, reject) => {
        const totalPromises = promises.length;
        let resolvedPromises = 0;
        let result = [] as T[];

        promises.forEach(p => {
            p.then((d: T) => {
                result.push(d);
                resolvedPromises++;
                if (resolvedPromises === totalPromises) {
                    resolve(result);
                }
            })

            p.catch(() => {
                resolvedPromises++;
                if (resolvedPromises === totalPromises) {
                    resolve(result);
                }
            })
        })
    })
}

export async function getUrlSize(url: string) {
    const response = await axios.head(url);
    return parseInt(response.headers['content-length'], 10) || 0;
}

export async function getChapterDownloadSize(pages: string[]) {
    return (await resolveAllPromises(pages.map(p => getUrlSize(p)))).reduce((total, currentSize) => total + currentSize, 0);
}

async function downloadPageFromUrl(url: string, sourceId: string, mangaId: string, chapterId: string, index: number, onDelta: (delta: number) => void): Promise<void> {
    let currentProgress = 0;
    try {
        const imageResponse = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer', onDownloadProgress: (event) => {
                const current = event.loaded
                onDelta(current - currentProgress);
                currentProgress = current;
            }
        });

        await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/${chapterId}/${index}.page`, 'data:image/png;base64, ' + encode(imageResponse.data));
    } catch (error) {
        onDelta(-currentProgress);
        console.log('error while downloading page', (error as any).message);
        await downloadPageFromUrl(url, sourceId, mangaId, chapterId, index, onDelta);
        return;
    }

}


export async function makeDir(dir: string) {
    const result = await Promise.race([FileSystem.makeDirectoryAsync(dir, { intermediates: true }), new Promise((resolve) => setTimeout(resolve, 4000, 'again'))])
    if (result === 'again') {
        await makeDir(dir);
    }
}

export async function downloadChapter(sourceId: string, mangaId: string, chapterId: string, onProgress: (progress: number) => void) {
    const url = `https://manga.oyintare.dev/${sourceId}/${mangaId}/chapters/${chapterId}`;
    const pageUrls: string[] | 'cancelled' = (await axios.get(url))?.data;
    if (pageUrls !== 'cancelled') {
        const dir = `${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/${chapterId}/`;
        try {
            if (!(await FileSystem.getInfoAsync(dir)).exists) await makeDir(dir);
        } catch (error) {
            console.log(error);
        }

        const totalDownloadSize = await getChapterDownloadSize(pageUrls);
        let progressSize = 0;
        function onDownloadDelta(delta: number) {

            progressSize += delta;
            onProgress(progressSize / totalDownloadSize)
        }
        await resolveAllPromises(pageUrls.map((res, idx) => { return downloadPageFromUrl(res, sourceId, mangaId, chapterId, idx, onDownloadDelta) }));
    }
}


