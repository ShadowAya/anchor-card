# anchor-card
An anchor (scroll to) card for Home Assistant!
<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTM1bGhlMWt0aHlhdG4wd3cycGdxY3UzYTlhaG5rbThjMnl2dHRpdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kMzSlpnnCpINj6YBMw/giphy.gif" alt="Preview" height="600px">
</p>

> There is currently no way to scroll to specific points in your dashboard. This card fixes this and acts as an anchor you can scroll to.

*made with the help of the [zupre](https://github.com/dangreco/zupre) template*

### Known issues

When navigating within the same page, a new entry for the same URL gets pushed into history. It's not possible to remove history entries, so the same page URL will appear in your history multiple times.

Example: when you navigate to "kitchen" and then to "kitchen - lights" and then "kitchen - covers", you'll have to go back three times to leave the "kitchen" page, instead of one

I am currently working on a workaround

## Usage

To use the `anchor-card`, you need to configure it with the following parameters:

1. **anchor_id**: An identifier unique to each page.
   - This allows you to scroll directly to this card by using the URL parameter `anchor`.
   - **Example**: To scroll to a card with an `anchor_id` of "lights", your URL would look like this: `lovelace/0?anchor=lights`

2. **negative_margin**: Adjusts the card's top-down margin for visual spacing.
   - Default value: `13px`.

3. **timeout**: Specifies the waiting time before scrolling to the card.
   - Useful in cases where other cards might take longer to render.
   - Default value: `150` (in ms).

4. **offset**: Determines the scroll offset.
   - Default value: `0`. It can also be set to a negative value to adjust the position as well.

5. **strict_url_change**: Set to true to only scroll when the url changes.
   - Default value: `false`

6. **disable_in_edit_mode**: Set to true to prevent scrolling when edit=1
   - Default value: `true`

7. **remove_anchor**: Set to true to remove the anchor from the url after scrolling to it.
   - Default value: `true`

### Configuration Example:

Here's an example configuration for the `anchor-card`:

```yaml
type: "custom:anchor-card"
anchor_id: lights
negative_margin: 10px
timeout: 200ms
offset: -5
```

Replace the values in the example with your desired settings, and add the card to your Lovelace dashboard.

## Installation

Follow these steps to install and use the `anchor-card` in your Home Assistant setup:

### HACS

#### Step 1: Add custom repository

1. Open HACS > Frontend
2. Go to the **Custom Repositories** tab (top right)
3. Fill out a new repo

   a. **Repository:** `https://github.com/ShadowAya/anchor-card`

   b. **Category:** Lovelace
   
6. Add

#### Step 2: Download the card

Download the card via the newly added repository

### Manual

#### Step 1: Download the Card

1. Navigate to the [releases section](https://github.com/ShadowAya/anchor-card/releases/latest).
2. Download the latest release.

#### Step 2: Add the Card to Home Assistant

1. Upload the downloaded `anchor-card.js` file to your Home Assistant configuration directory or any subdirectory of your choice. A common directory might be `/config/www`.

2. Next, you need to inform Home Assistant of this new resource:
   
   a. Open Home Assistant.
   
   b. Navigate to **Settings**.
   
   c. Choose the **Dashboards** category.
   
   d. Go to the **Resources** tab (top right).
   
   e. Click on the **Add Resource** button.
   
   f. In the dialog that appears, enter the following:
      - **URL**: `/local/anchor-card.js` (If you placed the file in a different subdirectory, adjust the path accordingly)
      - **Resource Type**: `JavaScript Module`

   g. Click on the **Create** button to add the resource.

#### Step 3: Verify Installation

Now that you've added the card as a resource, it should be available for use in your Lovelace dashboards. When creating or editing a dashboard, you should be able to add the `anchor-card` by its custom card type, e.g., `"custom:anchor-card"`.
