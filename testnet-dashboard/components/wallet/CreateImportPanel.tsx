"use client";

import { useState } from "react";
import { Card, Button, Input, ErrorText, Label } from "@/components/ui";
import { addWallet, addressFromPrivateKey, createWallet } from "@/lib/wallet";

export function CreateImportPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"choose" | "import">("choose");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  function generate() {
    const w = createWallet();
    addWallet(w.address, w.privateKey);
    onDone();
  }

  function importKey() {
    setError(null);
    try {
      const address = addressFromPrivateKey(privateKey.trim());
      addWallet(address, privateKey.trim());
      onDone();
    } catch {
      setError("That doesn't look like a valid private key.");
    }
  }

  return (
    <Card>
      <h2 className="font-sans text-lg font-semibold mb-1.5">Add a wallet</h2>
      <p className="text-sm text-muted mb-5">
        Generated or imported entirely in your browser, and saved only to this
        device&apos;s local storage. Nothing is sent anywhere until you sign and
        submit a transaction.
      </p>

      {mode === "choose" && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={generate}>Create new wallet</Button>
          <Button variant="outline" onClick={() => setMode("import")}>
            Import existing
          </Button>
        </div>
      )}

      {mode === "import" && (
        <div className="space-y-3">
          <div>
            <Label>Private key</Label>
            <Input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              onKeyDown={(e) => e.key === "Enter" && importKey()}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={importKey} disabled={!privateKey.trim()}>
              Import
            </Button>
            <Button variant="ghost" onClick={() => setMode("choose")}>
              Back
            </Button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </div>
      )}
    </Card>
  );
}
