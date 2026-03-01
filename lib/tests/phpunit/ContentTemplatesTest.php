<?php
/**
 *
 * @package    eportfolios
 * @subpackage tests
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

require_once(get_config('libroot') . 'contenttemplates.php');

/**
 * Test functions in lib/contenttemplates.php
 */
class ContentTemplatesTest extends MaharaUnitTest {

    /**
     * IDs of templates created during tests, for cleanup.
     */
    private $createdIds = array();

    protected function setUp(): void {
        parent::setUp();
        // Seed built-in templates so we have a known starting state.
        seed_content_templates();
    }

    protected function tearDown(): void {
        // Clean up any custom templates we created.
        foreach ($this->createdIds as $id) {
            try {
                delete_records('content_template', 'id', $id);
            }
            catch (Exception $e) {
                // Ignore cleanup failures.
            }
        }
        // Remove all seeded built-in templates.
        delete_records('content_template', 'builtin', 1);
        parent::tearDown();
    }

    /**
     * Helper to insert a custom template and track it for cleanup.
     */
    private function insertCustomTemplate($overrides = array()) {
        $data = (object)array_merge(array(
            'title'       => 'Test Custom Template',
            'description' => 'A test template',
            'content'     => '<p>Hello world</p>',
            'category'    => 'general',
            'sort_order'  => 100,
            'active'      => 1,
        ), $overrides);
        $id = save_content_template($data);
        $this->createdIds[] = $id;
        return $id;
    }

    /**
     * Test that get_content_templates() returns seeded built-in templates.
     */
    public function testGetContentTemplatesReturnsBuiltins() {
        $templates = get_content_templates();
        $this->assertNotEmpty($templates, 'Should return seeded built-in templates');
        // We seed 6 built-in templates.
        $this->assertCount(6, $templates, 'Should have 6 built-in templates');
    }

    /**
     * Test that get_content_templates() filters by category.
     */
    public function testGetContentTemplatesFiltersByCategory() {
        $templates = get_content_templates('reflection');
        $this->assertNotEmpty($templates, 'Should return templates in the reflection category');
        foreach ($templates as $t) {
            $this->assertEquals('reflection', $t->category, 'All returned templates should be in the reflection category');
        }
        // Built-in data has 2 reflection templates (Reflection Journal, Learning Goals).
        $this->assertCount(2, $templates, 'Should have 2 reflection templates');
    }

    /**
     * Test that save_content_template() inserts a new template and returns its ID.
     */
    public function testSaveContentTemplateInserts() {
        $id = $this->insertCustomTemplate(array('title' => 'Insert Test'));
        $this->assertIsInt($id, 'Should return an integer ID');
        $this->assertGreaterThan(0, $id, 'ID should be positive');

        $record = get_content_template($id);
        $this->assertNotFalse($record, 'Should be retrievable after insert');
        $this->assertEquals('Insert Test', $record->title);
        $this->assertEquals(0, (int)$record->builtin, 'Custom templates should not be built-in');
    }

    /**
     * Test that save_content_template() updates an existing template.
     */
    public function testSaveContentTemplateUpdates() {
        $id = $this->insertCustomTemplate(array('title' => 'Before Update'));

        $updateData = (object)array(
            'id'      => $id,
            'title'   => 'After Update',
            'content' => '<p>Updated content</p>',
        );
        $returnedId = save_content_template($updateData);
        $this->assertEquals($id, $returnedId, 'Should return the same ID on update');

        $record = get_content_template($id);
        $this->assertEquals('After Update', $record->title);
    }

    /**
     * Test that delete_content_template() deletes a custom template.
     */
    public function testDeleteContentTemplateDeletesCustom() {
        $id = $this->insertCustomTemplate();
        $result = delete_content_template($id);
        $this->assertTrue($result, 'Should return true for custom template deletion');

        $record = get_content_template($id);
        $this->assertFalse($record, 'Template should no longer exist after deletion');
        // Remove from cleanup list since it's already gone.
        $this->createdIds = array_diff($this->createdIds, array($id));
    }

    /**
     * Test that delete_content_template() refuses to delete a built-in template.
     */
    public function testDeleteContentTemplateRefusesBuiltin() {
        $templates = get_content_templates();
        $builtin = null;
        foreach ($templates as $t) {
            if ($t->builtin) {
                $builtin = $t;
                break;
            }
        }
        $this->assertNotNull($builtin, 'Should have at least one built-in template');

        $result = delete_content_template($builtin->id);
        $this->assertFalse($result, 'Should return false when trying to delete a built-in template');

        $record = get_content_template($builtin->id);
        $this->assertNotFalse($record, 'Built-in template should still exist after failed deletion');
    }

    /**
     * Test that toggle_content_template_active() toggles and preserves other fields.
     */
    public function testToggleContentTemplateActive() {
        $id = $this->insertCustomTemplate(array(
            'title'   => 'Toggle Test',
            'active'  => 1,
            'content' => '<p>Preserved content</p>',
        ));

        $newActive = toggle_content_template_active($id);
        $this->assertEquals(0, $newActive, 'Should toggle from 1 to 0');

        $record = get_content_template($id);
        $this->assertEquals(0, (int)$record->active, 'Database should reflect toggled state');
        $this->assertEquals('Toggle Test', $record->title, 'Title should be preserved after toggle');

        // Toggle back.
        $newActive = toggle_content_template_active($id);
        $this->assertEquals(1, $newActive, 'Should toggle from 0 to 1');
    }

    /**
     * Test that save_content_template() strips script tags via clean_html().
     */
    public function testCleanHtmlStripsScriptTags() {
        $id = $this->insertCustomTemplate(array(
            'content' => '<p>Safe content</p><script>alert("xss")</script><p>More safe</p>',
        ));

        $record = get_content_template($id);
        $this->assertStringNotContainsString('<script>', $record->content, 'Script tags should be stripped');
        $this->assertStringNotContainsString('alert(', $record->content, 'Script content should be stripped');
        $this->assertStringContainsString('Safe content', $record->content, 'Safe content should be preserved');
    }
}
