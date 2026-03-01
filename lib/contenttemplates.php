<?php
/**
 *
 * @package    eportfolios
 * @subpackage core
 * @author     Academe Research, Inc
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL version 3 or later
 * @copyright  (C) 2026 Academe Research, Inc.
 *
 */

defined('INTERNAL') || die();

/**
 * Get all active content templates, optionally filtered by category.
 *
 * @param string|null $category  Filter by category, or null for all.
 * @return array
 */
function get_content_templates($category = null) {
    $where = 'active = 1';
    $values = array();
    if ($category) {
        $where .= ' AND category = ?';
        $values[] = $category;
    }
    $sql = "SELECT * FROM {content_template} WHERE {$where} ORDER BY sort_order, title";
    $templates = get_records_sql_array($sql, $values);
    return $templates ? $templates : array();
}

/**
 * Get all content templates for admin management (including inactive).
 *
 * @return array
 */
function get_all_content_templates() {
    $sql = "SELECT * FROM {content_template} ORDER BY sort_order, title";
    $templates = get_records_sql_array($sql, array());
    return $templates ? $templates : array();
}

/**
 * Get a single content template by ID.
 *
 * @param int $id
 * @return object|false
 */
function get_content_template($id) {
    return get_record('content_template', 'id', $id);
}

/**
 * Save a content template (insert or update).
 *
 * @param object $data  Template data with fields: title, description, content, category, sort_order, active.
 *                      If id is set, update; otherwise insert.
 * @return int  The template ID.
 */
function save_content_template($data) {
    $now = db_format_timestamp(time());
    $record = new stdClass();
    $record->title = $data->title;
    $record->description = isset($data->description) ? $data->description : '';
    $record->content = clean_html($data->content);
    $record->category = isset($data->category) ? $data->category : null;
    $record->sort_order = isset($data->sort_order) ? (int)$data->sort_order : 0;
    $record->active = isset($data->active) ? (int)$data->active : 1;
    $record->mtime = $now;

    if (!empty($data->id)) {
        $record->id = $data->id;
        update_record('content_template', $record, 'id');
        return $record->id;
    }
    else {
        $record->builtin = isset($data->builtin) ? (int)$data->builtin : 0;
        $record->ctime = $now;
        return insert_record('content_template', $record, 'id', true);
    }
}

/**
 * Delete a content template by ID. Built-in templates cannot be deleted.
 *
 * @param int $id
 * @return bool  True on success, false if built-in.
 */
function delete_content_template($id) {
    $template = get_content_template($id);
    if (!$template) {
        return false;
    }
    if ($template->builtin) {
        return false;
    }
    delete_records('content_template', 'id', $id);
    return true;
}

/**
 * Toggle a content template's active status without affecting other fields.
 *
 * @param int $id
 * @return int|false  The new active value, or false if not found.
 */
function toggle_content_template_active($id) {
    $template = get_content_template($id);
    if (!$template) {
        return false;
    }
    $newactive = $template->active ? 0 : 1;
    execute_sql("UPDATE {content_template} SET active = ?, mtime = ? WHERE id = ?",
        array($newactive, db_format_timestamp(time()), $id));
    return $newactive;
}

/**
 * Get the distinct categories currently in use.
 *
 * @param bool $activeonly  Only return categories from active templates.
 * @return array
 */
function get_content_template_categories($activeonly = false) {
    $where = "category IS NOT NULL AND category != ''";
    if ($activeonly) {
        $where .= " AND active = 1";
    }
    $sql = "SELECT DISTINCT category FROM {content_template} WHERE {$where} ORDER BY category";
    $records = get_records_sql_array($sql, array());
    if (!$records) {
        return array();
    }
    $categories = array();
    foreach ($records as $r) {
        $categories[] = $r->category;
    }
    return $categories;
}

/**
 * Seed the built-in content templates. Called during upgrade.
 */
function seed_content_templates() {
    $templates = get_builtin_content_templates();
    $now = db_format_timestamp(time());
    $sort = 10;
    foreach ($templates as $template) {
        // Check if this built-in template already exists (by title)
        if (get_record('content_template', 'title', $template['title'], 'builtin', 1)) {
            continue;
        }
        $record = new stdClass();
        $record->title = $template['title'];
        $record->description = $template['description'];
        $record->content = $template['content'];
        $record->category = $template['category'];
        $record->sort_order = $sort;
        $record->active = 1;
        $record->builtin = 1;
        $record->ctime = $now;
        $record->mtime = $now;
        insert_record('content_template', $record);
        $sort += 10;
    }
}

/**
 * Get the built-in template definitions.
 *
 * @return array
 */
function get_builtin_content_templates() {
    return array(
        array(
            'title' => get_string('template.twocolumn.title', 'contenttemplates'),
            'description' => get_string('template.twocolumn.description', 'contenttemplates'),
            'category' => 'layout',
            'content' => '<table style="width: 100%; border-collapse: collapse;">'
                . '<tbody>'
                . '<tr>'
                . '<td style="width: 50%; vertical-align: top; padding: 12px;">'
                . '<h4>Left Column</h4>'
                . '<p>Enter your content here.</p>'
                . '</td>'
                . '<td style="width: 50%; vertical-align: top; padding: 12px;">'
                . '<h4>Right Column</h4>'
                . '<p>Enter your content here.</p>'
                . '</td>'
                . '</tr>'
                . '</tbody>'
                . '</table>',
        ),
        array(
            'title' => get_string('template.reflection.title', 'contenttemplates'),
            'description' => get_string('template.reflection.description', 'contenttemplates'),
            'category' => 'reflection',
            'content' => '<h4>Reflection Journal</h4>'
                . '<h5>What happened?</h5>'
                . '<p>Describe the experience or event you are reflecting on.</p>'
                . '<h5>What did I learn?</h5>'
                . '<p>What insights, skills, or knowledge did you gain?</p>'
                . '<h5>How do I feel about it?</h5>'
                . '<p>Describe your emotional response and why you feel that way.</p>'
                . '<h5>What will I do differently?</h5>'
                . '<p>Based on this reflection, what actions will you take going forward?</p>',
        ),
        array(
            'title' => get_string('template.project.title', 'contenttemplates'),
            'description' => get_string('template.project.description', 'contenttemplates'),
            'category' => 'portfolio',
            'content' => '<h4>Project Title</h4>'
                . '<p><strong>Date:</strong> </p>'
                . '<p><strong>Role:</strong> </p>'
                . '<h5>Overview</h5>'
                . '<p>Provide a brief summary of the project.</p>'
                . '<h5>Objectives</h5>'
                . '<ul>'
                . '<li>Objective 1</li>'
                . '<li>Objective 2</li>'
                . '<li>Objective 3</li>'
                . '</ul>'
                . '<h5>Process</h5>'
                . '<p>Describe the approach and methods used.</p>'
                . '<h5>Outcomes &amp; Results</h5>'
                . '<p>What were the key results and achievements?</p>'
                . '<h5>Lessons Learned</h5>'
                . '<p>What would you do differently next time?</p>',
        ),
        array(
            'title' => get_string('template.skills.title', 'contenttemplates'),
            'description' => get_string('template.skills.description', 'contenttemplates'),
            'category' => 'assessment',
            'content' => '<h4>Skills Matrix</h4>'
                . '<table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">'
                . '<thead>'
                . '<tr style="background-color: #f5f5f5;">'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Skill / Competency</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Beginner</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Intermediate</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Advanced</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Evidence / Notes</th>'
                . '</tr>'
                . '</thead>'
                . '<tbody>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Skill 1</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '</tr>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Skill 2</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '</tr>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Skill 3</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px; text-align: center;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '</tr>'
                . '</tbody>'
                . '</table>',
        ),
        array(
            'title' => get_string('template.goals.title', 'contenttemplates'),
            'description' => get_string('template.goals.description', 'contenttemplates'),
            'category' => 'reflection',
            'content' => '<h4>Learning Goals</h4>'
                . '<table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">'
                . '<thead>'
                . '<tr style="background-color: #f5f5f5;">'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Goal</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Actions / Steps</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Target Date</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Status</th>'
                . '</tr>'
                . '</thead>'
                . '<tbody>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Goal 1</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Steps to achieve this goal</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Not started</td>'
                . '</tr>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Goal 2</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Steps to achieve this goal</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Not started</td>'
                . '</tr>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Goal 3</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Steps to achieve this goal</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Not started</td>'
                . '</tr>'
                . '</tbody>'
                . '</table>',
        ),
        array(
            'title' => get_string('template.meeting.title', 'contenttemplates'),
            'description' => get_string('template.meeting.description', 'contenttemplates'),
            'category' => 'general',
            'content' => '<h4>Meeting Notes</h4>'
                . '<p><strong>Date:</strong> </p>'
                . '<p><strong>Attendees:</strong> </p>'
                . '<p><strong>Facilitator:</strong> </p>'
                . '<h5>Agenda</h5>'
                . '<ol>'
                . '<li>Item 1</li>'
                . '<li>Item 2</li>'
                . '<li>Item 3</li>'
                . '</ol>'
                . '<h5>Discussion Notes</h5>'
                . '<p>Key points discussed during the meeting.</p>'
                . '<h5>Decisions Made</h5>'
                . '<ul>'
                . '<li>Decision 1</li>'
                . '<li>Decision 2</li>'
                . '</ul>'
                . '<h5>Action Items</h5>'
                . '<table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">'
                . '<thead>'
                . '<tr style="background-color: #f5f5f5;">'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Action</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Assigned To</th>'
                . '<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Due Date</th>'
                . '</tr>'
                . '</thead>'
                . '<tbody>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Action item 1</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '</tr>'
                . '<tr>'
                . '<td style="border: 1px solid #ccc; padding: 8px;">Action item 2</td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '<td style="border: 1px solid #ccc; padding: 8px;"></td>'
                . '</tr>'
                . '</tbody>'
                . '</table>'
                . '<h5>Next Meeting</h5>'
                . '<p><strong>Date:</strong> </p>'
                . '<p><strong>Topics to follow up:</strong> </p>',
        ),
    );
}
