⏺ Perfect! I can see the full workflow. Here's how to restore an old version:

  How to Restore an Old Version

  1. Open the Dev Panel
    - Click the "DEV TOOLS" badge in the bottom-left corner of your app
  2. Go to the Versions Section
    - In the dev panel, look for the "Versions" section
    - You'll see two tabs: Snapshots and Milestones
  3. Find the Version You Want
    - Snapshots are listed by date (most recent first)
    - The current version has a "CURRENT" badge
    - You can see:
        - Snapshot name
      - Description
      - When it was saved
      - Number of files included
  4. Click the 📂 Load Button
    - Each snapshot has three action buttons:
        - 📂 = Load (restore this version)
      - ⭐ = Promote to milestone
      - 🗑️ = Delete
    - Click the 📂 Load button
  5. Confirm the Restoration
    - You'll get a warning: "This will replace your current state. Make sure to save first if
  needed."
    - Click OK to proceed
  6. Page Reloads
    - You'll be asked: "Page will reload to apply changes. Continue?"
    - Click OK
    - The page reloads with the restored version

  What Gets Restored

  When you load a snapshot, these files are restored:
  - types/schemas.js (your prompt engineering schemas)
  - test-data/mock-ai-engine.js (AI response logic)
  - test-data/scenarios/*.js (test scenarios)
  - config/features.js (feature flags)

  Important Notes

  - Save before restoring: If you have unsaved changes, create a snapshot first!
  - Can't delete current: You can't delete the snapshot you're currently using
  - Automatic tracking: After loading, that snapshot becomes your "CURRENT" version

  Pro tip: If you want to experiment with an old version, save your current state first as a
  snapshot like "before-experimenting", then you can easily get back to it!
