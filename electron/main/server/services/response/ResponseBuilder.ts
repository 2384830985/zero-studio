import {IExhibitionCon} from '../../utils'

/**
 * 响应构建器
 * 负责构建各种类型的响应
 */
export class ResponseBuilder {
  /**
   * 构建工具调用响应
   */
  buildToolCallResponse(
    initialContent: string,
    finalContent: string,
    toolCalls: any[],
    toolResults: any[],
    cardList: IExhibitionCon[],
  ) {
    return {
      content: `${initialContent}\n${finalContent}`,
      toolCalls,
      toolResults,
      cardList,
    }
  }

  /**
   * 构建流式响应
   */
  buildStreamResponse(stream: any) {
    return {
      stream,
    }
  }

  /**
   * 构建普通响应
   */
  buildNormalResponse(content: string) {
    return {
      content,
    }
  }
}
