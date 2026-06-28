const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'play', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update simState definition
content = content.replace(
  /const \[simState, setSimState\] = useState<"idle" \| "simulating" \| "broadcasting" \| "confirmed">\(("idle")\);/,
  'const [simState, setSimState] = useState<"idle" | "simulating" | "pending_signature" | "submitted" | "confirming" | "success" | "error" | "rejected">("idle");'
);

// 2. Helper to replace openContractCall block in a function
function replaceExecFunction(funcName, successUpdates) {
  const regex = new RegExp(`(async function ${funcName}\\(.*?\\) \\{\\s+[\\s\\S]*?)(setSimState\\("broadcasting"\\);\\s+try \\{\\s+await openContractCall\\(\\{[\\s\\S]*?onFinish: \\(data\\) => \\{)([\\s\\S]*?)(\\}\\s*\\})\\);\\s+\\} catch \\(error: any\\) \\{\\s+setSimState\\("idle"\\);\\s+setStatusMsg\\(\`.*?error: \\$\\{error.message\\}\`\\);\\s+\\}\\s+\\}`, 'g');
  
  // Custom replacement function since there are 5 different ones, I'll just write a generic replacer
}

// Alternatively, let's just use string replacements for the specific parts:
content = content.replace(/setSimState\("broadcasting"\);/g, 'setSimState("pending_signature");');

// Fix onCancel
content = content.replace(/onCancel: \(\) => \{ setSimState\("idle"\); setStatusMsg\("([^"]+)"\); \}/g, 'onCancel: () => { setSimState("rejected"); setStatusMsg("$1"); setTimeout(() => setSimState("idle"), 2000); }');

// Fix catch block
content = content.replace(/\} catch \(error: any\) \{\s+setSimState\("idle"\);\s+setStatusMsg\(`([^`]+)`\);\s+\}/g, '} catch (error: any) {\n      setSimState("error");\n      setStatusMsg(`$1`);\n      setTimeout(() => setSimState("idle"), 2000);\n    }');

// Fix onFinish: (data) => { setSimState("confirmed"); ... } -> to handle submitted, confirming, success
const onFinishRegex = /onFinish: \(data\) => \{\s+setSimState\("confirmed"\);\s+setStatusMsg\(`([^`]+)`\);\s+([\s\S]*?)setTimeout\(\(\) => setSimState\("idle"\), 2000\);\s+\}/g;
content = content.replace(onFinishRegex, (match, msg, updates) => {
  return `onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(\`${msg}\`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
${updates}
              setTimeout(() => setSimState("idle"), 2000);
            }, 2000);
          }, 1000);
        }`;
});

// For handleClaimPayout which is slightly different
// it doesn't set simState to confirmed inside onFinish and doesn't set idle in catch.
content = content.replace(/setStatusMsg\(`Claiming rewards for round #\$\{roundId\}\.\.\.`\);\s+try \{/, 'setSimState("pending_signature");\n    setStatusMsg(`Claiming rewards for round #${roundId}...`);\n    try {');
content = content.replace(/onFinish: \(data\) => \{\s+setStatusMsg\(`Jackpot claimed successfully! TxID: \$\{data\.txId\.substring\(0, 16\)\}\.\.\.`\);\s+([\s\S]*?)\},/g, (match, updates) => {
  return `onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(\`Jackpot claimed successfully! TxID: \${data.txId.substring(0, 16)}...\`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
${updates}              setTimeout(() => setSimState("idle"), 2000);
            }, 2000);
          }, 1000);
        },`;
});

// For handleClaimPayout onCancel and catch:
content = content.replace(/onCancel: \(\) => \{\s+setStatusMsg\("Claim canceled\."\);\s+\}\s+\}\);/, 'onCancel: () => {\n          setSimState("rejected");\n          setStatusMsg("Claim canceled.");\n          setTimeout(() => setSimState("idle"), 2000);\n        }\n      });');
content = content.replace(/catch \(err: any\) \{\s+setStatusMsg\(`Claim error: \$\{err.message\}`\);\s+\}/, 'catch (err: any) {\n      setSimState("error");\n      setStatusMsg(`Claim error: ${err.message}`);\n      setTimeout(() => setSimState("idle"), 2000);\n    }');

// Finally, update the UI for simState rendering
const uiReplacement = `
              {simState === "simulating" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Simulating Transaction</h2>
                  <p className="text-sm text-zinc-400 mb-6">
                    You are about to <span className="text-orange-400 font-bold capitalize">{simAction}</span>{" "}
                    <span className="text-white font-bold">{simAmount} {simAction === "redeem" ? "Credits" : "STX"}</span>
                  </p>
                  <div className="w-full bg-zinc-950 rounded-xl p-4 mb-8 text-left space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Action</span>
                      <span className="text-white capitalize">{simAction}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Amount</span>
                      <span className="text-white">{simAmount} {simAction === "redeem" ? "Credits" : "STX"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Est. Fee</span>
                      <span className="text-white">~0.002 STX</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setSimState("idle")}
                      className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-widest transition-colors"
                    >Cancel</button>
                    <button
                      onClick={async () => { if (pendingAction) await pendingAction(); }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
                    >Sign & Confirm</button>
                  </div>
                </>
              )}
              {simState === "pending_signature" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Pending Signature</h2>
                  <p className="text-sm text-zinc-400">Please sign the transaction in your wallet...</p>
                </>
              )}
              {simState === "submitted" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Broadcasting</h2>
                  <p className="text-sm text-zinc-400">Transaction submitted. Waiting for network...</p>
                </>
              )}
              {simState === "confirming" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-blue-400">Confirming</h2>
                  <p className="text-sm text-zinc-400">Waiting for block confirmation...</p>
                </>
              )}
              {simState === "success" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-green-400">Confirmed!</h2>
                  <p className="text-sm text-zinc-400">Your transaction was confirmed on the network.</p>
                </>
              )}
              {simState === "error" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-red-500">Error</h2>
                  <p className="text-sm text-zinc-400">There was an error processing the transaction.</p>
                </>
              )}
              {simState === "rejected" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-red-500">Rejected</h2>
                  <p className="text-sm text-zinc-400">You rejected the transaction.</p>
                </>
              )}
`;

content = content.replace(/\{simState === "simulating" && \([\s\S]*?\{simState === "confirmed" && \([\s\S]*?\}\)\s*\}/, uiReplacement);

fs.writeFileSync(filePath, content);
console.log('Refactored page.tsx');
