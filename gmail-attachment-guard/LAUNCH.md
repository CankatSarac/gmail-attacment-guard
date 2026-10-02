# Attachment Guard release

Website: https://extensions.teampire.uk/attachment-guard/
Support: dev@teampire.uk

An extra reminder before sending a Gmail message that mentions an attachment. Checks are local; shortcuts and nested send-button clicks are covered.

Privacy: The open compose text is inspected in memory immediately before a send attempt. Email contents and recipients are never saved or uploaded.

The root manifest is the Chrome build. Release files replace incomplete prototype paths while the earlier application source remains available in Git history and in unreferenced prototype files. Packages include only files referenced by the release manifest plus local legal notices. Firefox uses a generated manifest with background scripts, a stable Gecko ID and data declarations. Firefox signing uses the unlisted channel for testing; it does not publish a public AMO listing.

No credentials are required for building. Publishing credentials must be supplied from a local file outside the repository and are never included in a build.
