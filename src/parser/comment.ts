import * as ts from 'typescript';

// Parse Comments (that can disable ts-unused-exports)

export const isNodeDisabledViaComment = (
  node: ts.Node,
  file: ts.SourceFile,
): boolean => {
  const comments = ts.getLeadingCommentRanges(
    file.getFullText(),
    node.getFullStart(),
  );

  if (comments) {
    const commentRange = comments[comments.length - 1];
    const commentText = file
      .getFullText()
      .substring(commentRange.pos, commentRange.end);
    if (commentText === '// ts-unused-exports:disable-next-line') {
      return true;
    }
  }

  return false;
};
