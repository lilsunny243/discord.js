import type { ApiItem } from '@microsoft/api-extractor-model';
import type { DocComment, DocFencedCode, DocLinkTag, DocNode, DocNodeContainer, DocPlainText } from '@microsoft/tsdoc';
import { DocNodeKind, StandardTags } from '@microsoft/tsdoc';
import type { Route } from 'next';
import Link from 'next/link';
import { Fragment, useCallback, type ReactNode } from 'react';
import { ItemLink } from '../../ItemLink';
import { SyntaxHighlighter } from '../../SyntaxHighlighter';
import { resolveItemURI } from '../util';
import { DefaultValueBlock, DeprecatedBlock, ExampleBlock, RemarksBlock, ReturnsBlock, SeeBlock } from './BlockComment';

export function TSDoc({ item, tsdoc }: { readonly item: ApiItem; readonly tsdoc: DocNode }): JSX.Element {
	const createNode = useCallback(
		(tsdoc: DocNode, idx?: number): ReactNode => {
			switch (tsdoc.kind) {
				case DocNodeKind.PlainText:
					return (
						<span className="break-words" key={idx}>
							{(tsdoc as DocPlainText).text}
						</span>
					);
				case DocNodeKind.Section:
				case DocNodeKind.Paragraph:
					return (
						<span className="break-words leading-relaxed" key={idx}>
							{(tsdoc as DocNodeContainer).nodes.map((node, idx) => createNode(node, idx))}
						</span>
					);
				case DocNodeKind.SoftBreak:
					return <Fragment key={idx} />;
				case DocNodeKind.LinkTag: {
					const { codeDestination, urlDestination, linkText } = tsdoc as DocLinkTag;

					if (codeDestination) {
						const foundItem = item.getAssociatedModel()?.resolveDeclarationReference(codeDestination, item)
							.resolvedApiItem;

						if (!foundItem) return null;

						return (
							<ItemLink
								className="rounded font-mono text-blurple outline-none focus:ring focus:ring-width-2 focus:ring-blurple"
								itemURI={resolveItemURI(foundItem)}
								key={idx}
							>
								{linkText ?? foundItem.displayName}
							</ItemLink>
						);
					}

					if (urlDestination) {
						return (
							<Link
								className="rounded font-mono text-blurple outline-none focus:ring focus:ring-width-2 focus:ring-blurple"
								href={urlDestination as Route}
								key={idx}
							>
								{linkText ?? urlDestination}
							</Link>
						);
					}

					return null;
				}

				case DocNodeKind.CodeSpan: {
					const { code } = tsdoc as DocFencedCode;
					return (
						<code className="text-sm font-mono" key={idx}>
							{code}
						</code>
					);
				}

				case DocNodeKind.FencedCode: {
					const { language, code } = tsdoc as DocFencedCode;
					// @ts-expect-error async component
					return <SyntaxHighlighter code={code.trim()} key={idx} lang={language ?? 'typescript'} />;
				}

				case DocNodeKind.Comment: {
					const comment = tsdoc as DocComment;

					const exampleBlocks = comment.customBlocks.filter(
						(block) => block.blockTag.tagName.toUpperCase() === StandardTags.example.tagNameWithUpperCase,
					);

					const defaultValueBlock = comment.customBlocks.find(
						(block) => block.blockTag.tagName.toUpperCase() === StandardTags.defaultValue.tagNameWithUpperCase,
					);

					return (
						<div className="flex flex-col space-y-2">
							{comment.deprecatedBlock ? (
								<DeprecatedBlock>{createNode(comment.deprecatedBlock.content)}</DeprecatedBlock>
							) : null}
							{comment.summarySection ? createNode(comment.summarySection) : null}
							{comment.remarksBlock ? <RemarksBlock>{createNode(comment.remarksBlock.content)}</RemarksBlock> : null}
							{defaultValueBlock ? (
								<DefaultValueBlock>{createNode(defaultValueBlock.content)}</DefaultValueBlock>
							) : null}
							{comment.returnsBlock ? <ReturnsBlock>{createNode(comment.returnsBlock.content)}</ReturnsBlock> : null}
							{exampleBlocks.length
								? exampleBlocks.map((block, idx) => <ExampleBlock key={idx}>{createNode(block.content)}</ExampleBlock>)
								: null}
							{comment.seeBlocks.length ? (
								<SeeBlock>{comment.seeBlocks.map((seeBlock, idx) => createNode(seeBlock.content, idx))}</SeeBlock>
							) : null}
						</div>
					);
				}

				default:
					// console.log(`Captured unknown node kind: ${node.kind}`);
					return null;
			}
		},
		[item],
	);

	return (
		<>
			{tsdoc.kind === 'Paragraph' || tsdoc.kind === 'Section' ? (
				<>{(tsdoc as DocNodeContainer).nodes.map((node, idx) => createNode(node, idx))}</>
			) : (
				createNode(tsdoc)
			)}
		</>
	);
}
