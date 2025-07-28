# Typeform Setup for Event Submissions

## Form Structure

Create a Typeform with the following fields:

### 1. Welcome Screen
- Title: "Submit an Event to Toronto Event Calendar"
- Description: "Help us discover great events happening in Toronto! Submit your event for review and potential inclusion on our calendar."

### 2. Fields (in order):

#### Field 1: Event Name
- Type: Short text
- Question: "What's the name of your event?"
- Required: Yes
- Placeholder: "e.g. Summer Jazz Concert in Trinity Bellwoods"

#### Field 2: Your Name
- Type: Short text  
- Question: "What's your name?"
- Required: Yes
- Placeholder: "First and last name"

#### Field 3: Your Email
- Type: Email
- Question: "What's your email address? (optional)"
- Required: No
- Description: "We may contact you if we need more details about the event"

#### Field 4: Event Link
- Type: URL
- Question: "Do you have a link with more information about the event?"
- Required: No
- Placeholder: "https://..."
- Description: "Event website, Facebook page, Eventbrite link, etc."

#### Field 5: Event Description
- Type: Long text
- Question: "Tell us about the event"
- Required: Yes
- Placeholder: "Include date, time, location, ticket info, and what makes this event special..."
- Description: "The more details you provide, the easier it is for us to review and add your event"

### 3. Thank You Screen
- Title: "Thanks for your submission!"
- Description: "We'll review your event and add it to the calendar if it's a good fit. You should see it appear within 2-3 business days if approved."

## Email Integration

Configure the form to send notification emails to:
- **Primary**: [your submission email when you create it]
- **Backup**: saintgull94@gmail.com

Email should include all form responses in a readable format.

## Form Settings

- Allow multiple submissions: Yes
- Show progress bar: Yes
- Redirect after submission: Back to Toronto Event Calendar homepage
- Theme: Use colors that match the site (asparagus green, dark purple)

## After Creating the Form

1. Copy the Typeform URL
2. Replace the placeholder URL in Header.js:
   ```javascript
   href="https://form.typeform.com/to/YOUR-ACTUAL-FORM-ID"
   ```
3. Test the form submission
4. Verify email notifications are working

## Suggested Form URL Structure
- Short URL: something like `https://form.typeform.com/to/toronto-events`
- Or use a custom domain if you have one