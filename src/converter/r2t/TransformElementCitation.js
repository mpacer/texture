import { TextureJATS } from '../../article'

export default class TransformElementCitation {

  import(dom) {
    let elementCitations = dom.findAll('element-citation')
    elementCitations.forEach((elementCitation) => {
      _importElementCitation(elementCitation)
    })
  }

  export(dom) {
    let elementCitations = dom.findAll('element-citation')
    elementCitations.forEach((elementCitation) => {
      _exportElementCitation(elementCitation)
    })
  }
}

function _importElementCitation(elementCitation) {
  let doc = elementCitation.getOwnerDocument()
  let children = []

  let schema = TextureJATS.getElementSchema('element-citation')
  let tagNames = schema.getAllowedChildren()
  tagNames.forEach((tagName) => {
    if (tagName === 'content-location') {
      children.push(_extractContentLocation(elementCitation))
    } else if (tagName === 'pub-id') {
      children = children.concat(elementCitation.findAll(tagName))
    } else {
      let element = elementCitation.find(tagName)
      if (!element) {
        element = doc.createElement(tagName)
      }
      children.push(element)
    }
  })

  let newElementCitation = doc.createElement('element-citation').append(
    children
  )
  elementCitation.parentNode.replaceChild(elementCitation, newElementCitation)
}

function _exportElementCitation(elementCitation) {
  let doc = elementCitation.getOwnerDocument()
  let children = []

  let SPEC = {
    'journal': ['person-group', 'year', 'article-title', 'source', 'volume', 'content-location', 'issue', 'pub-id'],
    'book': ['person-group', 'chapter-title', 'source', 'publisher-loc', 'publisher-name', 'year', 'content-location', 'issue', 'pub-id']
  }

  let pubType = elementCitation.attr('publication-type')
  if (!pubType) throw new Error('FATAL: publication-type is not present')
  let tagNames = SPEC[pubType]

  tagNames.forEach((tagName) => {
    if (tagName === 'content-location') {
      children.push(_serializeContentLocation(elementCitation))
    } else if (tagName === 'pub-id') {
      children = children.concat(elementCitation.findAll(tagName))
    } else if (tagName === 'person-group') {
      children.push(elementCitation.find('person-group'))
    } else {
      let element = elementCitation.find(tagName)
      // TODO: maybe drop optional empty elements
      children.push(element)
    }
  })

  let newElementCitation = doc.createElement('element-citation').append(
    children
  )
  elementCitation.parentNode.replaceChild(elementCitation, newElementCitation)
}

/*
  TODO: test suite

  <fpage>1</fpage><lpage>5</lpage> => <content-location>1-5</content-location>
*/
function _extractContentLocation(elementCitation) {
  let doc = elementCitation.getOwnerDocument()
  let contentLocation = doc.createElement('content-location')
  let pageRange = elementCitation.find('page-range')
  let fpage = elementCitation.find('fpage')
  let lpage = elementCitation.find('lpage')
  let elocationId = elementCitation.find('elocation-id')

  if (pageRange) {
    contentLocation.append(pageRange.textContent)
  } else if (fpage && lpage) {
    contentLocation.append(`${fpage.textContent}-${lpage.textContent}`)
  } else if (fpage) {
    contentLocation.append(fpage.textContent)
  } else if (elocationId) {
    contentLocation.append(elocationId.textContent)
    contentLocation.attr('electronic', 'yes')
  }
  return contentLocation
}

function _serializeContentLocation(elementCitation) {
  let doc = elementCitation.getOwnerDocument()
  let children = []
  let contentLocation = elementCitation.find('content-location')
  if (contentLocation.attr('electronic') === 'yes') {
    children.push(doc.createElement('elocation-id').append(contentLocation.textContent))
  } else {
    // TODO: maybe include fpage-lpage
    children.push(doc.createElement('page-range').append(contentLocation.textContent))
  }
  return children
}
