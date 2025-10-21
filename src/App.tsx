import { useState } from "react";
import { HashMakerApp } from "./partials/HashMakerApp";
import { PrivateKeyForm } from "./partials/PrivateKeyForm";

function App() {
  const [privateKey, setPrivateKey] = useState("");

  return (
    <div className="grid place-items-center min-h-screen p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Hash Maker</h1>
        {privateKey ? (
          <HashMakerApp privateKey={privateKey} />
        ) : (
          <PrivateKeyForm onSubmit={(key) => setPrivateKey(key)} />
        )}
      </div>
    </div>
  );
}

export default App;
