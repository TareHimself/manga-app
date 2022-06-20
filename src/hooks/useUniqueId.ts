import { useRef } from "react";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export function useUniqueId() {
	const uniqueId = useRef(uuidv4()).current;

	return uniqueId;
}