import * as SQLite from 'expo-sqlite';
import { IMangaPreviewData, IStoredMangaChapter } from './types';


const initialStatements = [
	`
    CREATE TABLE IF NOT EXISTS bookmarks(
		src TEXT NOT NULL,
        id TEXT NOT NULL,
        title TEXT NOT NULL,
        cover TEXT NOT NULL,
        idx INTEGER NOT NULL
    );
    `,
	`
    CREATE TABLE IF NOT EXISTS chapters(
		src TEXT NOT NULL,
        manga TEXT NOT NULL,
        id TEXT NOT NULL,
		title TEXT NOT NULL,
		read INTEGER NOT NULL,
		offline INTEGER NOT NULL,
		idx INTEGER NOT NULL
    );
    `,
	`
    CREATE INDEX IF NOT EXISTS idx_bookmarks
    ON bookmarks (src,id);
    `,
	`
    CREATE INDEX IF NOT EXISTS idx_chapters
    ON chapters (src,manga,id);
    `

]

const db = SQLite.openDatabase('data.db');


export async function getBookmarks(source: string) {
	return new Promise<IMangaPreviewData[]>((resolve) => {
		db.readTransaction((tx) => {
			tx.executeSql('SELECT id,title,cover FROM bookmarks WHERE src=? ORDER BY idx ASC', [source], (txObj, { rows: { _array } }) => { resolve(_array || []) }, (tsx, err) => { console.log(err.message); return true; })
		})
	})
}

export async function setBookmarks(source: string, bookmarks: IMangaPreviewData[]) {
	return new Promise<void>((resolve) => {
		db.transaction((tx) => {
			tx.executeSql('DELETE FROM bookmarks WHERE src=?', [source]);
			bookmarks.forEach((b, idx) => {
				tx.executeSql(`INSERT INTO bookmarks(src,id,title,cover,idx) VALUES(?,?,?,?,?)`, [source, b.id, b.title, b.cover, idx], () => { }, (tsx, err) => { console.log(err.message); return true; });
			})
		}, () => { }, () => { resolve() })
	})
}

export async function getChapters(source: string, manga: string) {
	console.log("FETCHING DB CHAPTERTS", source, manga)
	return new Promise<IStoredMangaChapter[]>((resolve) => {
		db.readTransaction((tx) => {
			tx.executeSql('SELECT id,title,read,offline FROM chapters WHERE src=? AND manga=? ORDER BY idx DESC', [source, manga], (txObj, { rows: { _array } }) => { resolve(_array || []) }, (tsx, err) => { console.log(err.message); return true; })
		})
	})
}

export async function overwriteChapters(source: string, manga: string, chapters: IStoredMangaChapter[]) {
	console.log("OVERIDING DB CHAPTERTS WITH", chapters.length, source, manga)
	return new Promise<void>((resolve) => {
		db.transaction((tx) => {
			tx.executeSql('DELETE FROM chapters WHERE src=? AND manga=?', [source, manga]);
			chapters.forEach((c, idx) => {
				tx.executeSql(`INSERT INTO chapters(src,manga,id,title,read,offline,idx) VALUES(?,?,?,?,?,?,?)`, [source, manga, c.id, c.title, c.read, c.offline, (chapters.length - 1) - idx], () => { }, (tsx, err) => { console.log(err.message); return true; });
			})
		}, () => { }, () => { resolve() })
	})
}

export async function addChapters(source: string, manga: string, chapters: IStoredMangaChapter[], indexes: number[]) {
	return new Promise<void>((resolve) => {
		db.transaction((tx) => {
			chapters.forEach((c, idx) => {
				tx.executeSql(`INSERT INTO chapters(src,manga,id,title,read,offline,idx) VALUES(?,?,?,?,?,?,?)`, [source, manga, c.id, c.title, c.read, c.offline, indexes[idx]], () => { }, (tsx, err) => { console.log(err.message); return true; });
			})
		}, () => { }, () => { resolve() })
	})
}

export async function updateChapter(source: string, manga: string, c: IStoredMangaChapter) {
	return new Promise<void>((resolve) => {
		db.transaction((tx) => {
			tx.executeSql(`UPDATE chapters SET read=?,offline=? WHERE src=? AND manga=? AND id=?`, [c.read ? 1 : 0, c.offline ? 1 : 0, source, manga, c.id], () => { resolve() }, (a, e) => { console.log(e.message); return true; });
		}, (er) => { console.log(er.message); return true; }, () => { },)
	})
}
/*tx.executeSql('DROP TABLE bookmarks');
tx.executeSql('DROP TABLE chapters');
tx.executeSql('DROP INDEX idx_bookmarks');
tx.executeSql('DROP INDEX idx_chapters');*/

db.transaction((tx) => {
	initialStatements.forEach(statement => tx.executeSql(statement, undefined, () => { }, (a, e) => { console.log(statement, e.message); return true; }))
})

