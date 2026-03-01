@javascript @core @tinymce @contenttemplates
Feature: Content Templates plugin for TinyMCE
  As a user
  I want to insert pre-built content templates into the editor
  So that I can quickly scaffold structured content

  Background:
    Given the following "users" exist:
      | username | password | email             | firstname | lastname | institution | role   |
      | UserA    | Kupuh1pa!| UserA@example.org | Angela    | User     | mahara      | member |

  Scenario: Content templates button appears in TinyMCE toolbar
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    Then I should see the "button[aria-label='Content templates']" "css_element"

  Scenario: Clicking content templates button opens the template gallery modal
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    When I click the "Content templates" button in the editor
    Then I should see "Content Templates"
    And I should see "Insert Template"

  Scenario: Template gallery shows built-in templates with category filter
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    When I click the "Content templates" button in the editor
    Then I should see "Reflection Journal"
    And I should see "Two-Column Layout"
    And I should see "Project Showcase"
    And I should see "Skills Matrix"
    And I should see "Learning Goals"
    And I should see "Meeting Notes"
    # Category filter dropdown should be present
    And I should see "All Categories"

  Scenario: Selecting and inserting a template places HTML in editor
    Given I log in as "UserA" with password "Kupuh1pa!"
    And I choose "Journals" in "Create" from main menu
    And I click on "New entry"
    And I set the field "Title" to "Template Insert Test"
    When I click the "Content templates" button in the editor
    And I click on "Reflection Journal"
    And I click on "Insert Template"
    # Save the journal entry to verify content was inserted
    And I click on "Save entry"
    Then I should see "Template Insert Test"
    And I should see "What happened?"
    And I should see "What did I learn?"

  @admin
  Scenario: Admin can manage templates via Site Configuration page
    Given I log in as "admin" with password "Kupuh1pa!"
    And I choose "Configure site" from administration menu
    And I click on "Content templates"
    Then I should see "Reflection Journal"
    And I should see "Two-Column Layout"
    And I should see "Active"
    And I should see "Built-in"
