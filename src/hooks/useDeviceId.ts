import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function useDevieceId(): string {
	const [id, setId] = useState<string>('');

	useEffect(() => {
		async function getId() {
			const existingId = await SecureStore.getItemAsync('device-id');

			if (existingId) {
				setId(existingId);
			}
			else {
				const newId = uuidv4();
				await SecureStore.setItemAsync('device-id', newId);
				setId(newId);
			}
		}

		getId();
	}, [])

	return id;
}