# hass-anchor-card
An anchor (scroll to) card for Home Assistant!
> There is currently no way to scroll to specific points in your dashboard. This card fixes this and acts as an anchor you can scroll to.

*made with the help of the [zupre](https://github.com/dangreco/zupre) template*

## Usage

To use the `hass-anchor-card`, you need to configure it with the following parameters:

1. **anchor_id**: An identifier unique to each page.
   - This allows you to scroll directly to this card by using the URL parameter `anchor`.
   - **Example**: To scroll to a card with an `anchor_id` of "lights", your URL would look like this: `lovelace/0?anchor=lights`

2. **negative_margin**: Adjusts the card's top-down margin for visual spacing.
   - Default value: `13px`.

3. **timeout**: Specifies the waiting time before scrolling to the card.
   - Useful in cases where other cards might take longer to render.
   - Default value: `150ms`.

4. **offset**: Determines the scroll offset.
   - Default value: `0`. It can also be set to a negative value to adjust the position as well.

### Configuration Example:

Here's an example configuration for the `hass-anchor-card`:

```yaml
type: "custom:hass-anchor-card"
anchor_id: lights
negative_margin: 10px
timeout: 200ms
offset: -5
```

Replace the values in the example with your desired settings, and add the card to your Lovelace dashboard.

### Compatibility

The card was tested using the default Dashboard layout. Other layouts might not work as this card is dependent on its parent.
When checking whether to scroll or not, the card looks at each time the visibility of the column it is in changes (from not visible to visible).

You can fork, modify the source code and build the JS bundle yourself (using `npm run build`) to optimize for other custom layouts if necessary.
The method that finds the big enough parent unique to the card can be found in `src/index` `AnchorCard#getCardColumn`. Modify the condition(s) on line 21.

## Installation

Follow these steps to install and use the `anchor-card` in your Home Assistant setup:

### Step 1: Download the Card

1. Navigate to the [releases section](https://github.com/ShadowAya/anchor-card/releases/latest).
2. Download the latest release.

### Step 2: Add the Card to Home Assistant

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

### Step 3: Verify Installation

Now that you've added the card as a resource, it should be available for use in your Lovelace dashboards. When creating or editing a dashboard, you should be able to add the `anchor-card` by its custom card type, e.g., `"custom:anchor-card"`.
