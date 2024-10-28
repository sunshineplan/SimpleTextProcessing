<script lang="ts">
  let {
    id,
    placeholder = "",
    checked = $bindable(),
    optional = $bindable(null),
  }: {
    id: string;
    placeholder?: string;
    checked: boolean;
    optional?: string | null;
  } = $props();
</script>

{#if optional !== null}
  <div class="row align-items-center pb-1">
    <div class="col-4">
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          bind:checked
          {id}
          disabled={optional === ""}
        />
        <label class="form-check-label" for={id}>{id}</label>
      </div>
    </div>
    <div class="col">
      <label class="visually-hidden" for={id + placeholder}>
        {placeholder}
      </label>
      <input
        type="text"
        class="form-control form-control-sm"
        id={id + placeholder}
        {placeholder}
        bind:value={optional}
        oninput={() => {
          if (optional === "") checked = false;
          else if (!checked) checked = true;
        }}
      />
    </div>
  </div>
{:else}
  <div class="form-check">
    <input class="form-check-input" type="checkbox" bind:checked {id} />
    <label class="form-check-label" for={id}>{id}</label>
  </div>
{/if}

<style>
  input::placeholder {
    opacity: 0.3;
  }
</style>
