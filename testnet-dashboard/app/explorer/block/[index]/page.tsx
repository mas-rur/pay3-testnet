import { BlockDetail } from "./BlockDetail";

export default async function BlockPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index } = await params;
  return <BlockDetail index={index} />;
}
