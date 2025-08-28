import {INodeType, INodeTypeDescription, IExecuteFunctions, NodeOperationError, NodeApiError} from 'n8n-workflow';

export class TelegramPoll implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram Poll',
		name: 'telegramPoll',
		group: ['transform'],
		version: 1.1,
		icon: 'file:telegram_logo.svg',
		description: 'Sends a poll to a Telegram chat',
		defaults: {
			name: 'Telegram Poll',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'telegramApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the Telegram chat to send the poll to',
			},
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				default: '',
				required: true,
				description: 'The question for the poll',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'string',
				default: '',
				required: true,
				description: 'Comma-separated list of poll options',
			},
			{
				displayName: 'Poll Type',
				name: 'pollType',
				type: 'options',
				options: [
					{
						name: 'Regular',
						value: 'regular',
					},
					{
						name: 'Quiz',
						value: 'quiz',
					},
				],
				default: 'regular',
				description: 'Type of poll: regular or quiz',
			},
			{
				displayName: 'Anonymous Poll',
				name: 'isAnonymous',
				type: 'boolean',
				default: true,
				description: 'Whether the poll should be anonymous',
			},
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData = [];

		for (let i = 0; i < items.length; i++) {
			const chatId = this.getNodeParameter('chatId', i) as string;
			const question = this.getNodeParameter('question', i) as string;
			const options = this.getNodeParameter('options', i) as unknown as string;
			const pollType = this.getNodeParameter('pollType', i) as string;
			const isAnonymous = this.getNodeParameter('isAnonymous', i) as boolean;
			const credentials = await this.getCredentials('telegramApi');

			if (!credentials || !credentials.accessToken) {
				throw new NodeOperationError(this, 'No Telegram API credentials provided');
			}

			let requestBody = {
				chat_id: chatId,
				question,
				options: options.split(',').map(opt => opt.trim()),
				type: pollType,
				is_anonymous: isAnonymous,
			};

			try {
				const response = await this.helpers.request({
					method: 'POST',
					url: `https://api.telegram.org/bot${credentials.accessToken}/sendPoll`,
					body: requestBody,
					json: true,
				});

				if (!response.ok) {
					throw new NodeOperationError(this, `Telegram API error: ${response.description}`);
				}

				returnData.push(response);
			} catch (error) {
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error; // n8n обработает и выведет в лог
				}

				// Логируем и выбрасываем неизвестную ошибку
				throw new NodeOperationError(this, `Unexpected error: ${error.message}`);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
