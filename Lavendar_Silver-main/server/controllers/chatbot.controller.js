const db = require('../config/db');

exports.createQuestion = async (req, res) => {
  try {
    const { parent_id, question, answer, order } = req.body;
    
    const query = `
      INSERT INTO chatbot_questions (parent_id, question, answer, \`order\`) 
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [parent_id || null, question, answer, order || 0]);
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    // Get all questions with their children
    const query = `
      SELECT 
        q1.id,
        q1.parent_id,
        q1.question,
        q1.answer,
        q1.\`order\`,
        q1.created_at,
        q1.updated_at,
        q2.id as child_id,
        q2.parent_id as child_parent_id,
        q2.question as child_question,
        q2.answer as child_answer,
        q2.\`order\` as child_order
      FROM chatbot_questions q1
      LEFT JOIN chatbot_questions q2 ON q1.id = q2.parent_id
      ORDER BY q1.\`order\`, q1.id, q2.\`order\`, q2.id
    `;
    
    const [rows] = await db.execute(query);
    
    // Transform to hierarchical structure
    const questionsMap = new Map();
    
    rows.forEach(row => {
      if (!questionsMap.has(row.id)) {
        questionsMap.set(row.id, {
          id: row.id,
          parent_id: row.parent_id,
          question: row.question,
          answer: row.answer,
          order: row.order,
          created_at: row.created_at,
          updated_at: row.updated_at,
          children: []
        });
      }
      
      if (row.child_id) {
        questionsMap.get(row.id).children.push({
          id: row.child_id,
          parent_id: row.child_parent_id,
          question: row.child_question,
          answer: row.child_answer,
          order: row.child_order
        });
      }
    });
    
    const questions = Array.from(questionsMap.values());
    
    res.json({
      success: true,
      message: 'Questions retrieved successfully',
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, question, answer, order } = req.body;
    
    const query = `
      UPDATE chatbot_questions 
      SET parent_id = ?, question = ?, answer = ?, \`order\` = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.execute(query, [parent_id || null, question, answer, order || 0, id]);
    
    res.json({
      success: true,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the question and all its children (cascade)
    const query = 'DELETE FROM chatbot_questions WHERE id = ? OR parent_id = ?';
    await db.execute(query, [id, id]);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
};