import type { ApiClass, ApiInterface, Excerpt } from '@microsoft/api-extractor-model';
import { ApiItemKind } from '@microsoft/api-extractor-model';
import { ExcerptText } from '../ExcerptText';

export function HierarchyText({
	item,
	type,
}: {
	readonly item: ApiClass | ApiInterface;
	readonly type: 'Extends' | 'Implements';
}) {
	const model = item.getAssociatedModel()!;

	if (
		(item.kind === ApiItemKind.Class &&
			(item as ApiClass).extendsType === undefined &&
			(item as ApiClass).implementsTypes.length === 0) ||
		(item.kind === ApiItemKind.Interface && !(item as ApiInterface).extendsTypes)
	) {
		return null;
	}

	let excerpts: Excerpt[];

	if (item.kind === ApiItemKind.Class) {
		if (type === 'Implements') {
			if ((item as ApiClass).implementsTypes.length === 0) {
				return null;
			}

			excerpts = (item as ApiClass).implementsTypes.map((typeExcerpt) => typeExcerpt.excerpt);
		} else {
			if (!(item as ApiClass).extendsType) {
				return null;
			}

			excerpts = [(item as ApiClass).extendsType!.excerpt];
		}
	} else {
		if ((item as ApiInterface).extendsTypes.length === 0) {
			return null;
		}

		excerpts = (item as ApiInterface).extendsTypes.map((typeExcerpt) => typeExcerpt.excerpt);
	}

	return (
		<div className="flex flex-row place-items-center gap-4">
			<h3 className="text-xl font-bold">{type}</h3>
			<span className="break-all font-mono space-y-2">
				{excerpts.map((excerpt, idx) => (
					<ExcerptText excerpt={excerpt} key={idx} model={model} />
				))}
			</span>
		</div>
	);
}
