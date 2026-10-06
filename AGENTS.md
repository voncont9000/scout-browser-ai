<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep marketplace integrations behind a shared adapter contract so provider-specific extraction never leaks into screening or ranking logic.
- Keep protected dealer data under Cloud row-level policies and authenticated server functions because browser route guards are not a security boundary.
- Run ingestion, AI screening, and embeddings as bounded idempotent database-backed jobs because page-triggered processing can duplicate cost and work.
- Store AI tags once per listing and apply each dealer profile at read time because profile edits must re-screen without new model calls.
