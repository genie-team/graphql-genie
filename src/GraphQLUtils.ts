import { isListType, isNonNullType } from 'graphql';

export const typeIsList = (type) => {
	let isList = false;
	if (type.name && type.name.endsWith('Connection')) {
		isList = true;
	}
	while (!isList && (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST')) {
		if (isListType(type) || type.kind === 'LIST') {
			isList = true;
			break;
		}
		type = type.ofType;
	}
	return isList;
};

export const getReturnType = (type): string => {
	if (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST') {
		return getReturnType(type.ofType);
	} else {
		return type.name;
	}
};
