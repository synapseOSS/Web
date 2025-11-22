import { TestBed } from '@angular/core/testing';
import { InteractiveElementService, PollData, QuestionData, CountdownData, LinkData } from './interactive-element.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

describe('InteractiveElementService', () => {
  let service: InteractiveElementService;
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    mockSupabase = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
          })
        }),
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: {}, error: null }))
          })
        }),
        upsert: jasmine.createSpy('upsert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: {}, error: null }))
          })
        })
      }),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: true, error: null }))
    };

    mockAuth = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'user-123' })
    };

    TestBed.configureTestingModule({
      providers: [
        InteractiveElementService,
        { provide: SupabaseService, useValue: { client: mockSupabase } },
        { provide: AuthService, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(InteractiveElementService);
  });

  describe('Property 3: Interactive element validation', () => {
    it('should reject poll with invalid question', () => {
      const invalidPoll: any = {
        question: '',
        options: ['Option 1', 'Option 2']
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('Poll must have a valid question');
    });

    it('should reject poll with too few options', () => {
      const invalidPoll: any = {
        question: 'Valid question?',
        options: ['Only one']
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('Poll must have between 2 and 4 options');
    });

    it('should reject poll with too many options', () => {
      const invalidPoll: any = {
        question: 'Valid question?',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5']
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('Poll must have between 2 and 4 options');
    });

    it('should reject poll with empty option', () => {
      const invalidPoll: any = {
        question: 'Valid question?',
        options: ['Option 1', '']
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('All poll options must be non-empty strings');
    });

    it('should reject poll with option exceeding character limit', () => {
      const invalidPoll: any = {
        question: 'Valid question?',
        options: ['Option 1', 'A'.repeat(51)]
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('Poll options must be 50 characters or less');
    });

    it('should reject poll with question exceeding character limit', () => {
      const invalidPoll: any = {
        question: 'A'.repeat(201),
        options: ['Option 1', 'Option 2']
      };

      expect(() => service.validateElement('poll', invalidPoll))
        .toThrowError('Poll question must be 200 characters or less');
    });

    it('should accept valid poll', () => {
      const validPoll: PollData = {
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green']
      };

      expect(() => service.validateElement('poll', validPoll)).not.toThrow();
    });

    it('should reject question with empty text', () => {
      const invalidQuestion: any = {
        question: ''
      };

      expect(() => service.validateElement('question', invalidQuestion))
        .toThrowError('Question must have valid text');
    });

    it('should reject question exceeding character limit', () => {
      const invalidQuestion: any = {
        question: 'A'.repeat(201)
      };

      expect(() => service.validateElement('question', invalidQuestion))
        .toThrowError('Question must be 200 characters or less');
    });

    it('should reject question with invalid placeholder', () => {
      const invalidQuestion: any = {
        question: 'What do you think?',
        placeholder: 123
      };

      expect(() => service.validateElement('question', invalidQuestion))
        .toThrowError('Question placeholder must be a string');
    });

    it('should accept valid question', () => {
      const validQuestion: QuestionData = {
        question: 'What do you think?',
        placeholder: 'Type your answer...'
      };

      expect(() => service.validateElement('question', validQuestion)).not.toThrow();
    });

    it('should reject countdown with empty title', () => {
      const invalidCountdown: any = {
        title: '',
        target_date: new Date(Date.now() + 86400000).toISOString()
      };

      expect(() => service.validateElement('countdown', invalidCountdown))
        .toThrowError('Countdown must have a valid title');
    });

    it('should reject countdown with invalid date', () => {
      const invalidCountdown: any = {
        title: 'Event',
        target_date: 'not-a-date'
      };

      expect(() => service.validateElement('countdown', invalidCountdown))
        .toThrowError('Countdown target date must be a valid ISO date string');
    });

    it('should reject countdown with past date', () => {
      const invalidCountdown: any = {
        title: 'Event',
        target_date: new Date(Date.now() - 86400000).toISOString()
      };

      expect(() => service.validateElement('countdown', invalidCountdown))
        .toThrowError('Countdown target date must be in the future');
    });

    it('should accept valid countdown', () => {
      const validCountdown: CountdownData = {
        title: 'Product Launch',
        target_date: new Date(Date.now() + 86400000).toISOString(),
        end_message: 'Launched!'
      };

      expect(() => service.validateElement('countdown', validCountdown)).not.toThrow();
    });

    it('should reject link with empty URL', () => {
      const invalidLink: any = {
        url: ''
      };

      expect(() => service.validateElement('link', invalidLink))
        .toThrowError('Link must have a valid URL');
    });

    it('should reject link with invalid URL', () => {
      const invalidLink: any = {
        url: 'not-a-url'
      };

      expect(() => service.validateElement('link', invalidLink))
        .toThrowError('Link URL must be a valid URL');
    });

    it('should reject link with non-HTTP protocol', () => {
      const invalidLink: any = {
        url: 'ftp://example.com'
      };

      expect(() => service.validateElement('link', invalidLink))
        .toThrowError('Link URL must use HTTP or HTTPS protocol');
    });

    it('should accept valid link', () => {
      const validLink: LinkData = {
        url: 'https://example.com',
        title: 'Check this out'
      };

      expect(() => service.validateElement('link', validLink)).not.toThrow();
    });

    it('should reject invalid element type', () => {
      expect(() => service.validateElement('invalid-type', {}))
        .toThrowError('Invalid element type: invalid-type');
    });
  });

  describe('Property 23: Interactive response recording and aggregation', () => {
    it('should record poll response', async () => {
      const elementId = 'element-123';
      const responseData = { selected_options: ['Option 1'] };

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    element_type: 'poll',
                    element_data: { question: 'Test?', options: ['Option 1', 'Option 2'] },
                    story_id: 'story-123'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'response-123', element_id: elementId, response_data: responseData },
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const response = await service.recordResponse(elementId, responseData);
      expect(response).toBeDefined();
      expect(response.element_id).toBe(elementId);
    });

    it('should reject invalid poll response', async () => {
      const elementId = 'element-123';
      const invalidResponse = { selected_options: ['Invalid Option'] };

      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                element_type: 'poll',
                element_data: { question: 'Test?', options: ['Option 1', 'Option 2'] },
                story_id: 'story-123'
              },
              error: null
            })
          })
        })
      });

      await expectAsync(service.recordResponse(elementId, invalidResponse))
        .toBeRejectedWithError('Invalid poll option: Invalid Option');
    });

    it('should record question response', async () => {
      const elementId = 'element-123';
      const responseData = { answer: 'This is my answer' };

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    element_type: 'question',
                    element_data: { question: 'What do you think?' },
                    story_id: 'story-123'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'response-123', element_id: elementId, response_data: responseData },
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const response = await service.recordResponse(elementId, responseData);
      expect(response).toBeDefined();
    });

    it('should reject empty question response', async () => {
      const elementId = 'element-123';
      const invalidResponse = { answer: '' };

      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                element_type: 'question',
                element_data: { question: 'What do you think?' },
                story_id: 'story-123'
              },
              error: null
            })
          })
        })
      });

      await expectAsync(service.recordResponse(elementId, invalidResponse))
        .toBeRejectedWithError('Question answer cannot be empty');
    });
  });

  describe('Property 24: Poll percentage calculation', () => {
    it('should calculate poll percentages correctly', async () => {
      const elementId = 'element-123';
      const responses = [
        { id: '1', element_id: elementId, user_id: 'user1', response_data: { selected_options: ['Option 1'] }, created_at: '' },
        { id: '2', element_id: elementId, user_id: 'user2', response_data: { selected_options: ['Option 1'] }, created_at: '' },
        { id: '3', element_id: elementId, user_id: 'user3', response_data: { selected_options: ['Option 2'] }, created_at: '' }
      ];

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    element_data: { question: 'Test?', options: ['Option 1', 'Option 2'] },
                    story_id: 'story-123',
                    stories: { user_id: 'user-123' }
                  },
                  error: null
                }),
                order: () => Promise.resolve({ data: responses, error: null })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: responses, error: null })
              })
            })
          };
        }
        return {};
      });

      const results = await service.getPollResults(elementId);
      
      expect(results.total_votes).toBe(3);
      expect(results.options[0].option).toBe('Option 1');
      expect(results.options[0].votes).toBe(2);
      expect(results.options[0].percentage).toBe(67); // 2/3 = 66.67% rounded to 67
      expect(results.options[1].option).toBe('Option 2');
      expect(results.options[1].votes).toBe(1);
      expect(results.options[1].percentage).toBe(33); // 1/3 = 33.33% rounded to 33
    });

    it('should handle zero votes correctly', async () => {
      const elementId = 'element-123';

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    element_data: { question: 'Test?', options: ['Option 1', 'Option 2'] },
                    story_id: 'story-123',
                    stories: { user_id: 'user-123' }
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            })
          };
        }
        return {};
      });

      const results = await service.getPollResults(elementId);
      
      expect(results.total_votes).toBe(0);
      expect(results.options[0].percentage).toBe(0);
      expect(results.options[1].percentage).toBe(0);
    });
  });

  describe('Property 25: Question responses completeness', () => {
    it('should retrieve all question responses', async () => {
      const elementId = 'element-123';
      const responses = [
        { id: '1', element_id: elementId, user_id: 'user1', response_data: { answer: 'Answer 1' }, created_at: '2024-01-01' },
        { id: '2', element_id: elementId, user_id: 'user2', response_data: { answer: 'Answer 2' }, created_at: '2024-01-02' },
        { id: '3', element_id: elementId, user_id: 'user3', response_data: { answer: 'Answer 3' }, created_at: '2024-01-03' }
      ];

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    story_id: 'story-123',
                    stories: { user_id: 'user-123' }
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: responses, error: null })
              })
            })
          };
        }
        return {};
      });

      const questionResponses = await service.getQuestionResponses(elementId);
      
      expect(questionResponses.length).toBe(3);
      expect(questionResponses[0].answer).toBe('Answer 1');
      expect(questionResponses[1].answer).toBe('Answer 2');
      expect(questionResponses[2].answer).toBe('Answer 3');
      expect(questionResponses[0].user_id).toBe('user1');
    });

    it('should handle empty question responses', async () => {
      const elementId = 'element-123';

      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_interactive_elements') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: {
                    story_id: 'story-123',
                    stories: { user_id: 'user-123' }
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_interactive_responses') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            })
          };
        }
        return {};
      });

      const questionResponses = await service.getQuestionResponses(elementId);
      expect(questionResponses.length).toBe(0);
    });
  });
});
