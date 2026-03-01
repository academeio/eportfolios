@javascript @core @tinymce
Feature: TinyMCE 7 editor loads and supports basic editing
  As a user
  I want the TinyMCE editor to load on pages with WYSIWYG fields
  So that I can create and format rich content

  Background:
    Given the following "users" exist:
      | username | password | email             | firstname | lastname | institution | role   |
      | UserA    | Kupuh1pa!| UserA@example.org | Angela    | User     | mahara      | member |

  Scenario: TinyMCE 7 editor loads on a page with a WYSIWYG field
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    Then I should see "Body" in the "div.wysiwyg" "css_element"
    And I should see the ".tox-editor-container" "css_element"

  Scenario: User can type and save content via the editor
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    And I set the field "Title" to "My TinyMCE Test Entry"
    And I fill in "Hello from TinyMCE 7" in first editor
    And I click on "Save entry"
    Then I should see "My TinyMCE Test Entry"

  Scenario: Editor toolbar contains expected custom buttons
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    Then I should see the ".tox-editor-container" "css_element"
    And I should see the "button[aria-label='Insert image']" "css_element"
    And I should see the "button[aria-label='Content templates']" "css_element"
