'use strict'

import React from "react"
import MentionHighlighter from 'components/plugins/mention-highlighter'
import User from "components/User"
import File from "components/File"
import TextMessage from "components/TextMessage"
import Directory from "components/Directory"
import ChannelActions from 'actions/ChannelActions'
import UserActions from 'actions/UserActions'
import NotificationActions from 'actions/NotificationActions'
import TransitionGroup from "react-addons-css-transition-group"
import { getFormattedTime } from '../utils/utils.js'
import "styles/Message2.scss"

class Message extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      post: null,
      user: null,
      hasHighlights: false,
      isCommand: false,
      formattedTime: getFormattedTime(props.message.meta.ts),
      showSignature: false,
      showProfile: null
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.post !== nextState.post
      || this.state.user !== nextState.user
  }

  componentDidMount() {
    ChannelActions.loadPost(this.props.message.value, (err, post) => {
      if (post) {
        UserActions.getUser(post.meta.from, (err, user) => {
          this.setState({ post: post, user: user })

          if (post.content) {
            if (post.content.startsWith('/me')) {
              this.state.isCommand = true
            }
            post.content.split(' ').forEach((word) => {
              const highlight = MentionHighlighter.highlight(word, this.props.highlightWords)
              if(typeof highlight[0] !== 'string' && this.props.highlightWords !== post.meta.from) {
                this.state.hasHighlights = true
                NotificationActions.mention(this.state.channelName, post.content) // TODO: where does channelName come from?
              }
            })
          }
        })
      }
    })
  }

  onReplyTo(event) {
    const { post, user } = this.state
    const hash = this.props.message.value
    this.setState({ replyto: hash })
    this.props.onReplyTo({
      hash: hash,
      content: post.meta.type === 'text' ? post.content : post.name,
      user: user,
    })
  }

  renderContent() {
    const { highlightWords, useEmojis } = this.props
    const { isCommand, post } = this.state
    const contentClass = isCommand ? "Content2 command" : "Content2"
    let content = (<div></div>)
    if (post) {
      switch (post.meta.type) {
        case 'text':
          content = (
            <TextMessage
              text={post.content}
              replyto={post.replyToContent}
              useEmojis={useEmojis}
              highlightWords={post.meta.from !== highlightWords ? highlightWords : ''}
              key={post.hash} />
          )
          break
        case 'file':
          content = <File hash={post.hash} name={post.name} size={post.size} meta={post.meta} onPreviewOpened={this.props.onScrollToPreview}/>
          break
        case 'directory':
          content = <Directory hash={post.hash} name={post.name} size={post.size} root={true} onPreviewOpened={this.props.onScrollToPreview}/>
          break
      }
    }
    return <div className={contentClass} onClick={this.onReplyTo.bind(this)}>{content}</div>
  }

  render() {
    const { message, colorifyUsername, style, onDragEnter } = this.props
    const { user, post, isCommand, hasHighlights, formattedTime } = this.state
    const className = hasHighlights ? "Message2 highlighted" : "Message2"

    return (
      <div className={className} style={style} onDragEnter={onDragEnter}>
        <div className="Avatar"></div>
        <div className="Text">
          <div className="rowrow2">
            <User
              user={user}
              colorify={colorifyUsername}
              highlight={isCommand}
              onShowProfile={this.props.onShowProfile.bind(this, user)}
              />
            <span className="Timestamp2">{formattedTime}</span>
          </div>
          {this.renderContent()}
        </div>
      </div>
    )
  }

}

export default Message
