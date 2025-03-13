export function init_pipe_of<
  const TNameSpace extends string,
  const TEntType extends string
>(
  name_space: TNameSpace,
  ent_type: TEntType
): TNameSpace extends ""
  ? `node.${TEntType}.init_pipe`
  : `${TNameSpace}.node.${TEntType}.init_pipe` {
  if (name_space.length > 0) {
    return `${name_space}.node.${ent_type}.init_pipe` as any;
  }
  return `node.${ent_type}.init_pipe` as any;
}
