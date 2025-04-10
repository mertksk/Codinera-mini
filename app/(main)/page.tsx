"use client";

import CodeViewer from "@/components/code-viewer";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch"; // Keep Switch import if needed elsewhere, otherwise remove
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import LoadingDots from "../../components/loading-dots";

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

export default function Home() {
  let [status, setStatus] = useState<
    "initial" | "creating" | "created" | "updating" | "updated"
  >("initial");
  let [prompt, setPrompt] = useState("");
  // Define model type including optional disabled flag
  type ModelOption = {
    label: string;
    value: string;
    disabled?: boolean;
  };
  // Updated models array with speed labels
  let models: ModelOption[] = [
    {
      label: "gemini-2.0-flash-exp (Fast)", // Added speed label
      value: "gemini-2.0-flash-exp",
    },
    {
      label: "gemini-2.5-pro-exp-03-25 (Slow)", // Added speed label
      value: "gemini-2.5-pro-exp-03-25",
    },
    {
      label: "Deepseek R1 (Coming Soon)",
      value: "deepseek-r1",
      disabled: true, // Mark as disabled
    }
  ];
  let [model, setModel] = useState(models[0].value); // Default to the first available model
  let [modification, setModification] = useState("");
  let [generatedCode, setGeneratedCode] = useState("");
  let [initialAppConfig, setInitialAppConfig] = useState({
    model: "",
  });
  let [ref, scrollTo] = useScrollTo();
  // Store conversation history including user prompts and assistant (code) responses
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  // Add state for forcing CodeViewer re-render
  let [viewerKey, setViewerKey] = useState(0);
  // Add state to control code editor visibility
  let [showCodeEditorView, setShowCodeEditorView] = useState(false); 

  let loading = status === "creating" || status === "updating";
  // Condition to show the viewer/modification section
  let shouldShowViewerSection = status === "created" || status === "updated" || status === "updating";

  async function createApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    let res = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    let receivedData = "";
    let cleanedData = ""; // Declare cleanedData outside the loop

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      receivedData += new TextDecoder().decode(value);
      // Assign to the outer cleanedData variable (fix duplicated line)
      cleanedData = removeCodeFormatting(receivedData);
      setGeneratedCode(cleanedData);
    }

    // Use the outer cleanedData variable here
    // Set messages only once with both user prompt and assistant response
    setMessages([
      { role: "user", content: prompt },
      { role: "assistant", content: cleanedData },
    ]);
    setInitialAppConfig({ model });
    setStatus("created");
    setShowCodeEditorView(false); // Reset to preview-only view on new creation
    // Removed setViewerKey from here
  }

  async function updateApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Check status directly instead of using the removed variable
    if (!(status === 'created' || status === 'updated') || !modification) return;

    scrollTo({ delay: 0.5 });
    setStatus("updating");

    // Prepare messages for the API, including history and the new modification
    const apiMessages = [
      ...messages,
      { role: "user", content: modification },
    ];

    let res = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: initialAppConfig.model || model, // Use initial model for consistency
        messages: apiMessages,
      }),
    });

    if (!res.ok) {
      // TODO: Handle error display better
      console.error("Update failed:", res.statusText);
      setStatus("created"); // Revert status on failure
      return;
    }

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    let receivedData = "";
    let finalCleanedCode = ""; // Variable to hold the final code
    // Don't clear generatedCode here; let the key change handle the refresh

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      receivedData += new TextDecoder().decode(value);
      // Only update the temporary variable during the stream
      finalCleanedCode = removeCodeFormatting(receivedData);
    }

    // Set generatedCode state ONLY ONCE after the loop finishes
    setGeneratedCode(finalCleanedCode);

    // Add the modification prompt and the new assistant response to messages
    setMessages([
      ...apiMessages,
      // Use finalCleanedCode here too for consistency
      { role: "assistant", content: finalCleanedCode },
    ]);
    setModification(""); // Clear modification input
    setStatus("updated");
    setShowCodeEditorView(true); // Ensure editor stays visible after update
    // Removed setViewerKey from here
  }

  // Effect to scroll the code viewer
  useEffect(() => {
    let el = document.querySelector(".cm-scroller");
    if (el && loading) {
      let end = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  // Effect to update viewerKey AFTER code generation/update is complete
  useEffect(() => {
    // Removed console logs
    if (status === 'created' || status === 'updated') {
      setViewerKey(prev => prev + 1);
    }
  }, [generatedCode, status]); // Depend on generatedCode and status

  // Removed console log

  return (
    // Added flex-grow to main element
    <main className="mt-12 flex w-full flex-col items-center px-4 text-center sm:mt-1 dark:bg-dark dark:text-gray-100 flex-grow">
      <a
        // Adjusted background/border for dark mode purple theme
        className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[50px] border-[0.5px] border-solid border-gray-300 bg-primary-100/50 dark:bg-primary-900/30 dark:border-primary-700 px-7 py-5 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)] text-gray-700 dark:text-gray-300"
        href="www.codinera.com"
        target="_blank"
      >
        <span className="text-center">
          Powered by <span className="font-medium">Codinera</span>
        </span>
      </a>
      {/* Adjusted text colors */}
      <h1 className="my-6 max-w-3xl text-4xl font-bold text-gray-900 dark:text-white sm:text-6xl">
        Turn your <span className="text-primary-600 dark:text-primary-400">idea</span>
        <br /> into an <span className="text-primary-600 dark:text-primary-400">app</span>
      </h1>

      <form className="w-full max-w-xl" onSubmit={createApp}>
        <fieldset disabled={loading} className="disabled:opacity-75">
          <div className="relative mt-5">
            {/* Adjusted background blur */}
            <div className="absolute -inset-2 rounded-[32px] bg-primary-300/30 dark:bg-primary-900/40 blur" />
            {/* Adjusted background, text, placeholder, focus colors */}
            <div className="relative flex rounded-3xl bg-white dark:bg-primary-900/60 shadow-sm border border-gray-300 dark:border-primary-700">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <textarea
                  rows={3}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  name="prompt"
                  className="w-full resize-none rounded-l-3xl bg-transparent px-6 py-5 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                  placeholder="Build me a calculator app..."
                />
              </div>
              {/* Adjusted button colors */}
              <button
                type="submit"
                disabled={loading}
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 disabled:text-gray-500 dark:text-primary-400 dark:hover:text-primary-300 dark:disabled:text-gray-500"
              >
                {status === "creating" ? (
                  <LoadingDots color={document.documentElement.classList.contains('dark') ? 'white' : 'black'} style="large" />
                ) : (
                  <ArrowLongRightIcon className="-ml-0.5 size-6" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center justify-between gap-3 sm:justify-center">
              {/* Adjusted text color */}
              <p className="text-gray-600 dark:text-gray-400 sm:text-xs">Model:</p>
              <Select.Root
                name="model"
                disabled={loading}
                value={model}
                onValueChange={(value) => setModel(value)}
              >
                {/* Adjusted trigger styles */}
                <Select.Trigger className="group flex w-60 max-w-xs items-center rounded-2xl border border-gray-300 dark:border-primary-700 bg-white dark:bg-primary-900/60 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
                  <Select.Value />
                  <Select.Icon className="ml-auto">
                    {/* Adjusted icon color */}
                    <ChevronDownIcon className="size-6 text-gray-400 group-focus-visible:text-primary-500 group-enabled:group-hover:text-primary-500 dark:text-gray-500 dark:group-focus-visible:text-primary-400 dark:group-enabled:group-hover:text-primary-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  {/* Adjusted content styles */}
                  <Select.Content className="overflow-hidden rounded-md bg-white dark:bg-primary-800 shadow-lg border border-gray-200 dark:border-primary-700">
                    <Select.Viewport className="p-2">
                      {models.map((model) => (
                        <Select.Item
                          key={model.value}
                          value={model.value}
                          disabled={model.disabled} // Add disabled attribute
                          // Adjusted item styles, add disabled styling
                          className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[highlighted]:bg-primary-100 dark:data-[highlighted]:bg-primary-700 data-[highlighted]:outline-none"
                        >
                          <Select.ItemText asChild>
                            {/* Adjusted item text styles */}
                            <span className="inline-flex items-center gap-2">
                              <div className="size-2 rounded-full bg-green-500" />
                              {model.label}
                            </span>
                          </Select.ItemText>
                          <Select.ItemIndicator className="ml-auto">
                            {/* Adjusted check icon color */}
                            <CheckIcon className="size-5 text-primary-600 dark:text-primary-400" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                    <Select.Arrow />
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
        </fieldset>
      </form>

      {/* Adjusted hr color */}
      <hr className="border-1 my-12 h-px w-full bg-gray-200 dark:bg-primary-700/50" />

      {/* Code Viewer and Modification Section */}
      {shouldShowViewerSection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          // Keep only one animate prop
          animate={{
            opacity: 1,
            y: 0,
            height: "auto",
            // Removed overflow: "hidden" and transitionEnd
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="w-full pt-1" // Removed pb-[25vh]
          onAnimationComplete={() => scrollTo()}
          ref={ref}
        >
          {/* Removed overflow-hidden from this div */}
          <div className="relative mt-8 w-full">
            <div className="isolate relative"> {/* Added relative positioning for the button */}
              {/* Use viewerKey to force Sandpack re-initialization only on completion */}
              {/* Pass showCodeEditorView state to showEditor prop */}
              <CodeViewer key={viewerKey} code={generatedCode} showEditor={showCodeEditorView} /> 

              {/* Conditionally render "Show Code" button */}
              {!showCodeEditorView && (
                <button
                  type="button"
                  onClick={() => setShowCodeEditorView(true)}
                  className="absolute top-4 right-4 z-10 inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Show Code
                </button>
              )}
            </div>

            {/* Combined Modification and Download Section */}
            {/* Use Flexbox to align form and button */}
            <div className="mt-8 flex w-full max-w-xl items-start gap-2"> {/* Added flex container */}
              {/* Modification Form */}
              <form className="flex-grow" onSubmit={updateApp}> {/* Removed width, added flex-grow */}
                 <fieldset disabled={loading} className="disabled:opacity-75">
                   <div className="relative"> {/* Removed mt-5 */}
                     {/* Adjusted background blur */}
                     <div className="absolute -inset-2 rounded-[32px] bg-primary-300/30 dark:bg-primary-900/40 blur" />
                     {/* Input group div */}
                     <div className="relative flex rounded-3xl bg-white dark:bg-primary-900/60 shadow-sm border border-gray-300 dark:border-primary-700">
                       <div className="relative flex flex-grow items-stretch focus-within:z-10">
                         <textarea
                           rows={2}
                           required
                           value={modification}
                           onChange={(e) => setModification(e.target.value)}
                           name="modification"
                           className="w-full resize-none rounded-l-3xl bg-transparent px-6 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                           placeholder="Make changes..." // Shortened placeholder
                         />
                       </div>
                       {/* Submit button */}
                       <button
                         type="submit"
                         disabled={loading || !modification}
                         className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 disabled:text-gray-500 dark:text-primary-400 dark:hover:text-primary-300 dark:disabled:text-gray-500"
                         aria-label="Submit modification" 
                       >
                         {status === "updating" ? (
                           <LoadingDots color={document.documentElement.classList.contains('dark') ? 'white' : 'black'} style="large" />
                         ) : (
                           <ArrowUpOnSquareIcon className="-ml-0.5 size-6" /> 
                         )}
                       </button>
                     </div>
                     {/* End input group div */}
                   </div>
                  </fieldset>
                </form>
                {/* End Modification Form */}

              {/* Download Button (Now adjacent to form) */}
              {/* Removed justify-center div, adjusted margin/height */}
              <button
                type="button"
                onClick={() => window.location.href = '/api/downloadProject'}
                className="inline-flex h-[68px] items-center gap-x-2 self-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50" // Matched height/style
                disabled={loading} // Disable while creating/updating
              >
                <ArrowDownTrayIcon className="-ml-0.5 size-5" aria-hidden="true" />
                <span className="hidden sm:inline">Download and Continue</span> {/* Hide text on small screens */}
              </button>
              {/* End Download Button */}
            </div> {/* Close flex container */}

            <AnimatePresence>
              {loading && (
                <motion.div
                  // Animate loading overlay based on status
                  initial={status === "updating" ? { x: "100%" } : { opacity: 0 }}
                  animate={status === "updating" ? { x: "0%" } : { opacity: 1 }}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    duration: 0.85,
                    delay: 0.5,
                  }}
                  className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-r border border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-50 to-primary-200 dark:from-primary-800 dark:to-primary-950 md:inset-y-0 md:left-1/2 md:right-0"
                >
                  {/* Adjusted loading text color */}
                  <p className="animate-pulse text-3xl font-bold text-primary-700 dark:text-primary-200">
                    {status === "creating" ? "Building..." : "Updating..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </main>
  );
}

async function minDelay<T>(promise: Promise<T>, ms: number) {
  let delay = new Promise((resolve) => setTimeout(resolve, ms));
  let [p] = await Promise.all([promise, delay]);

  return p;
}
