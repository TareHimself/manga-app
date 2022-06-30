import { EventEmitter } from 'events';
let chaptersEmitter: EventEmitter | null = null;

const emitters = new Map<string, EventEmitter>();

export function getChaptersEmitter() {
	if (!emitters.get('read-chapters')) emitters.set('read-chapters', new EventEmitter());

	return (emitters.get('read-chapters') as EventEmitter);
}

export function getBookmarksEmitter() {

	if (!emitters.get('bookmarks')) emitters.set('bookmarks', new EventEmitter());

	return (emitters.get('bookmarks') as EventEmitter);
}