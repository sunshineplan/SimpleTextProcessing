<script lang="ts">
  import { javascript } from "@codemirror/lang-javascript";
  import {
    drawSelection,
    highlightActiveLineGutter,
    lineNumbers,
    placeholder,
  } from "@codemirror/view";
  import { highlightSelectionMatches } from "@codemirror/search";
  import { EditorView } from "codemirror";
  import { onMount } from "svelte";
  import * as stp from "./stp";
  import Checkbox from "./Checkbox.svelte";

  let data: EditorView, result: EditorView;
  let trimSpace = false;
  let cutSpace = false;
  let removeParentheses = false;
  let trim = false;
  let trimCutset = "";
  let cut = false;
  let cutSep = "";
  let removeByRegExp = false;
  let re = "";
  let loading = false;

  onMount(() => {
    data = new EditorView({
      doc: localStorage.getItem("data") || "",
      parent: document.getElementById("input")!,
      extensions: [
        javascript(),
        drawSelection(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        lineNumbers(),
        placeholder("Paste content here..."),
        EditorView.lineWrapping,
      ],
    });
    result = new EditorView({
      doc: "",
      parent: document.getElementById("result")!,
      extensions: [
        javascript(),
        drawSelection(),
        highlightSelectionMatches(),
        lineNumbers(),
        EditorView.lineWrapping,
        EditorView.editable.of(false),
      ],
    });
  });

  const process = () => {
    const task = new stp.tasks();
    if (trimSpace) task.append(stp.trimSpace);
    if (cutSpace) task.append(stp.cutSpace);
    if (removeParentheses) task.append(...stp.removeParentheses.tasks);
    if (trim) task.append(new stp.trim(trimCutset));
    if (cut) task.append(new stp.cut(cutSep));
    if (removeByRegExp) task.append(new stp.removeByRegExp(new RegExp(re)));
    loading = true;
    const process = processing();
    const r = task.processAll(data.state.doc.toString().split("\n"));
    clearInterval(process);
    result.dispatch({
      changes: {
        from: 0,
        to: result.state.doc.length,
        insert: r.join("\n"),
      },
    });
    loading = false;
  };

  const clear = () => {
    data.dispatch({ changes: { from: 0, to: data.state.doc.length } });
    result.dispatch({ changes: { from: 0, to: result.state.doc.length } });
  };

  const copy = async () => {
    const res = result.state.doc.toString();
    if (res.trim() !== "")
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(res.trim());
        alert("Text has been copied to clipboard.");
      } else
        alert("This function requires a secure origin. (HTTPS or localhost)");
  };

  const processing = () => {
    return setInterval(() => {
      const s = result.state.doc.toString().split("Processing");
      let dots = s.length >= 2 ? s[1].length : 0;
      if (dots < 3) dots++;
      else dots -= 3;
      result.dispatch({
        changes: {
          from: 0,
          to: result.state.doc.length,
          insert: "Processing" + ".".repeat(dots),
        },
      });
    }, 200);
  };
</script>

<svelte:window
  on:beforeunload={() =>
    localStorage.setItem("data", data.state.doc.toString())}
/>

<header class="navbar navbar-expand navbar-light flex-column flex-md-row">
  <a
    class="navbar-brand text-primary m-0 mr-md-3"
    href="/"
    style="font-size:24px"
  >
    Simple Text Processing
  </a>
</header>
<div class="container-fluid">
  <div class="row h-100">
    <div id="input" class="col-5 h-100">
      <label for="input">Data</label>
    </div>
    <div class="col-2 p-0 pt-5">
      <Checkbox id="TrimSpace" bind:checked={trimSpace} />
      <Checkbox id="CutSpace" bind:checked={cutSpace} />
      <Checkbox id="RemoveParentheses" bind:checked={removeParentheses} />
      <br />
      <Checkbox
        id="Trim"
        placeholder="Cutset"
        bind:checked={trim}
        bind:optional={trimCutset}
      />
      <Checkbox
        id="Cut"
        placeholder="Sep"
        bind:checked={cut}
        bind:optional={cutSep}
      />
      <Checkbox
        id="Remove"
        placeholder="RegExp"
        bind:checked={removeByRegExp}
        bind:optional={re}
      />
      <br />
      <button
        on:click={process}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Process
      </button>
      <br />
      <br />
      <button
        on:click={copy}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Copy Result
      </button>
      <br />
      <br />
      <button
        on:click={clear}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Clear
      </button>
    </div>
    <div id="result" class="col-5 h-100">
      <label for="result">Result</label>
    </div>
  </div>
</div>

<style>
  .navbar {
    height: 80px;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .container-fluid {
    position: fixed;
    height: calc(100% - 80px);
  }
</style>
