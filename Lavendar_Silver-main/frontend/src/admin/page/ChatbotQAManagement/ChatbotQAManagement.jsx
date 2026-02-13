import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ChatbotQAManagement.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function flattenTree(tree, parent = null, level = 0) {
  let flat = [];
  tree.forEach(node => {
    flat.push({ ...node, level, parent });
    if (node.children && node.children.length > 0) {
      flat = flat.concat(flattenTree(node.children, node, level + 1));
    }
  });
  return flat;
}

// Remove duplicates based on ID
function removeDuplicates(questions) {
  const seen = new Set();
  const unique = [];

  function processNode(node) {
    if (seen.has(node.id)) {
      return null;
    }
    seen.add(node.id);

    const processedNode = {
      ...node,
      children: node.children ? node.children.map(processNode).filter(Boolean) : []
    };

    return processedNode;
  }

  questions.forEach(node => {
    const processed = processNode(node);
    if (processed) {
      unique.push(processed);
    }
  });

  return unique;
}

// Build proper tree structure ensuring no duplicates
function buildTreeStructure(questions) {
  if (!questions || questions.length === 0) return [];

  // If already a tree structure, clean it
  if (questions.length > 0 && questions[0].children !== undefined) {
    const cleaned = [];
    const seenIds = new Set();

    function processNode(node) {
      if (seenIds.has(node.id)) {
        return null;
      }
      seenIds.add(node.id);

      const processedNode = {
        id: node.id,
        parent_id: node.parent_id,
        question: node.question,
        answer: node.answer,
        order: node.order || 0,
        children: []
      };

      if (node.children && node.children.length > 0) {
        const childIds = new Set();
        node.children.forEach(child => {
          if (!childIds.has(child.id)) {
            childIds.add(child.id);
            const processedChild = processNode(child);
            if (processedChild) {
              processedNode.children.push(processedChild);
            }
          }
        });
      }

      return processedNode;
    }

    questions.forEach(node => {
      const processed = processNode(node);
      if (processed) {
        cleaned.push(processed);
      }
    });

    // Sort by order
    function sortByOrder(nodes) {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortByOrder(node.children);
        }
      });
    }

    sortByOrder(cleaned);
    return cleaned;
  }

  // If flat structure, build tree
  const questionMap = new Map();
  const rootQuestions = [];
  const flatList = flattenTree(questions);

  // First pass: create map of all unique questions
  const seenIds = new Set();
  flatList.forEach(q => {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id);
      questionMap.set(q.id, {
        id: q.id,
        parent_id: q.parent_id,
        question: q.question,
        answer: q.answer,
        order: q.order || 0,
        children: []
      });
    }
  });

  // Second pass: build tree structure
  questionMap.forEach((q, id) => {
    if (q.parent_id && questionMap.has(q.parent_id)) {
      const parent = questionMap.get(q.parent_id);
      parent.children.push(q);
    } else {
      rootQuestions.push(q);
    }
  });

  // Sort by order
  function sortByOrder(nodes) {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortByOrder(node.children);
      }
    });
  }

  sortByOrder(rootQuestions);
  return rootQuestions;
}

const initialForm = { question: '', answer: '', parent_id: null, order: 0 };

const ChatbotQAManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [parentQuestionText, setParentQuestionText] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/chatbot/questions`)
      .then(res => {
        const rawData = res.data.data || [];
        // Build proper tree structure (handles duplicates internally)
        const treeData = buildTreeStructure(rawData);
        setQuestions(treeData);
        setError('');
      })
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    setParentOptions(flattenTree(questions).filter(q => q.level === 0));
  }, [questions]);

  // Helper to get parent question text by id
  const getParentQuestionText = (parent_id) => {
    if (!parent_id) return '';
    const flat = flattenTree(questions);
    const parent = flat.find(q => q.id === parent_id);
    return parent ? parent.question : '';
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'parent_id') {
      setParentQuestionText(getParentQuestionText(value));
    }
  };

  const handleAdd = (parent_id = null) => {
    setForm({ ...initialForm, parent_id });
    setEditingId(null);
    setShowForm(true);
    setParentQuestionText(getParentQuestionText(parent_id));
  };

  const handleEdit = q => {
    setForm({
      question: q.question,
      answer: q.answer,
      parent_id: q.parent_id,
      order: q.order || 0
    });
    setEditingId(q.id);
    setShowForm(true);
    setParentQuestionText(getParentQuestionText(q.parent_id));
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this question and all its sub-answers?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/chatbot/questions/${id}`);
      setRefresh(r => !r);
    } catch {
      alert('Failed to delete');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/chatbot/questions/${editingId}`, form);
      } else {
        await axios.post(`${API_BASE_URL}/api/chatbot/questions`, form);
      }
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
      setParentQuestionText('');
      setRefresh(r => !r);
    } catch {
      alert('Failed to save');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(initialForm);
    setEditingId(null);
    setParentQuestionText('');
  };

  // Render tree recursively with styled nodes
  const renderTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className={`chatbotqa-tree-level chatbotqa-level-${level}`}>
        {nodes.map(q => (
          <div key={q.id} className="chatbotqa-card-wrapper">
            <div className={`chatbotqa-card chatbotqa-level-${level}`}>
              <div className="chatbotqa-card-header">
                <div className="chatbotqa-level-badge">
                  {level === 0 && <span className="chatbotqa-level-icon">📋</span>}
                  {level === 1 && <span className="chatbotqa-level-icon">📝</span>}
                  {level >= 2 && <span className="chatbotqa-level-icon">📄</span>}
                  <span className="chatbotqa-level-label">
                    {level === 0 ? 'MAIN QUESTION' : level === 1 ? 'SUB-QUESTION' : 'SUB-SUB-QUESTION'}
                  </span>
                </div>
              </div>

              <div className="chatbotqa-card-body">
                <div className="chatbotqa-question-text">{q.question}</div>
                <div className="chatbotqa-answer-text">
                  {q.answer.length > 80 ? q.answer.substring(0, 80) + '...' : q.answer}
                </div>
              </div>

              <div className="chatbotqa-card-footer">
                <button
                  onClick={() => handleAdd(q.id)}
                  className="chatbotqa-btn chatbotqa-btn-add"
                >
                  {level === 0 ? 'ADD SUB' : 'ADD SUB-SUB'}
                </button>
                <button
                  onClick={() => handleEdit(q)}
                  className="chatbotqa-btn chatbotqa-btn-edit"
                >
                  EDIT
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="chatbotqa-btn chatbotqa-btn-delete"
                >
                  DELETE
                </button>
              </div>
            </div>

            {q.children && q.children.length > 0 && (
              <div className="chatbotqa-children-container">
                {renderTree(q.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Determine form heading
  let formHeading = '';
  if (editingId) {
    formHeading = form.parent_id ? 'Edit Sub-Question' : 'Edit Main Question';
  } else if (form.parent_id) {
    formHeading = 'Add Sub-Question';
  } else {
    formHeading = 'Add Main Question';
  }

  return (
    <div className="chatbotqa-container">
      <div className="chatbotqa-header-section">
        <h2 className="chatbotqa-header">Chatbot Q&amp;A Management</h2>
        <button className="chatbotqa-add-main" onClick={() => handleAdd(null)}>
          Add Main Question
        </button>
      </div>

      {loading ? (
        <div className="chatbotqa-loading">Loading...</div>
      ) : error ? (
        <div className="chatbotqa-error">{error}</div>
      ) : questions.length === 0 ? (
        <div className="chatbotqa-empty">No questions found. Add your first main question to get started.</div>
      ) : (
        <div className="chatbotqa-questions-container">
          {renderTree(questions)}
        </div>
      )}

      {/* Modal Popup for Form */}
      {showForm && (
        <div className="chatbotqa-modal-overlay" onClick={handleCancel}>
          <div className="chatbotqa-modal-content" onClick={e => e.stopPropagation()}>
            <div className="chatbotqa-modal-header">
              <h3>{formHeading}</h3>
              <button className="chatbotqa-modal-close" onClick={handleCancel}>×</button>
            </div>

            {form.parent_id && parentQuestionText && (
              <div className="chatbotqa-parent-info">
                Parent: <span>{parentQuestionText}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="chatbotqa-form">
              <div className="chatbotqa-form-group">
                <label>Question:</label>
                <input
                  name="question"
                  value={form.question}
                  onChange={handleInputChange}
                  required
                  className="chatbotqa-input"
                />
              </div>

              <div className="chatbotqa-form-group">
                <label>Answer:</label>
                <textarea
                  name="answer"
                  value={form.answer}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="chatbotqa-textarea"
                />
              </div>

              <div className="chatbotqa-form-group">
                <label>Order:</label>
                <input
                  name="order"
                  type="number"
                  value={form.order}
                  onChange={handleInputChange}
                  className="chatbotqa-input"
                />
              </div>

              {form.parent_id && (
                <div className="chatbotqa-form-group">
                  <label>Parent Question:</label>
                  <select
                    name="parent_id"
                    value={form.parent_id}
                    onChange={handleInputChange}
                    required
                    className="chatbotqa-select"
                  >
                    <option value="">-- Select Parent --</option>
                    {parentOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.question}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="chatbotqa-form-actions">
                <button type="submit" className="chatbotqa-btn-primary">
                  {editingId ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={handleCancel} className="chatbotqa-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotQAManagement;