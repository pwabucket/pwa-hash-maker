import { useState } from "react";
import { HashMakerApp } from "./partials/HashMakerApp";
import { PrivateKeyForm } from "./partials/PrivateKeyForm";
import Logo from "./assets/logo.svg";

function App() {
  const [privateKey, setPrivateKey] = useState("");

  return (
    <div className="grid place-items-center min-h-dvh p-4">
      <div className="w-full max-w-sm flex flex-col gap-4 py-4">
        <img src={Logo} alt="Hash Maker Logo" className="w-32 h-32 mx-auto" />
        <h1 className="text-5xl text-center font-megrim">Hash Maker</h1>

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
