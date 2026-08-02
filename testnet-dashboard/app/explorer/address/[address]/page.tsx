import { AddressDetail } from "./AddressDetail";

export default async function AddressPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <AddressDetail address={address} />;
}
