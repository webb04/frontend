package model.dotcomponents

import common.Edition
import conf.{Configuration, Static}
import controllers.ArticlePage
import model.SubMetaLinks
import model.dotcomrendering.pageElements.PageElement
import navigation.NavMenu
import play.api.libs.json._
import play.api.mvc.RequestHeader
import views.support.{CamelCase, GUDateTimeFormat, GoogleAnalyticsAccount, ImgSrc, Item1200}
import ai.x.play.json.Jsonx
import common.Maps.RichMap
import navigation.UrlHelpers.{AmpFooter, AmpHeader}
import common.commercial.CommercialProperties
import navigation.UrlHelpers.{Footer, Header, SideMenu, getReaderRevenueUrl}
import navigation.ReaderRevenueSite.{Support, SupportContribute, SupportSubscribe}
import model.meta.{Guardian, LinkedData, PotentialAction}
import ai.x.play.json.implicits.optionWithNull
import experiments.Experiment // Note, required despite Intellij saying otherwise

// We have introduced our own set of objects for serializing data to the DotComponents API,
// because we don't want people changing the core frontend models and as a side effect,
// making them incompatible with Dotcomponents. By having our own set of models, there's
// only one reason for change.
// exceptions: we do resuse the existing Nav & BlockElement classes right now

case class TagProperties(
    id: String,
    tagType: String,
    webTitle: String,
    twitterHandle: Option[String]
)
case class Tag(
    properties: TagProperties
)

case class Block(
    bodyHtml: String,
    elements: List[PageElement]
)

case class Blocks(
    main: Option[Block],
    body: List[Block]
)

case class ReaderRevenueLink(
  contribute: String,
  subscribe: String,
  support: String
)

case class ReaderRevenueLinks(
  header: ReaderRevenueLink,
  footer: ReaderRevenueLink,
  sideMenu: ReaderRevenueLink,
  ampHeader: ReaderRevenueLink,
  ampFooter: ReaderRevenueLink
)

case class IsPartOf(
  `@type`: List[String] = List("CreativeWork", "Product"),
  name: String = "The Guardian",
  productID: String = "theguardian.com:basic"
)

object IsPartOf {
  implicit val formats: OFormat[IsPartOf] = Json.format[IsPartOf]
}

case class NewsArticle(
  override val `@type`: String,
  override val `@context`: String,
  `@id`: String,
  potentialAction: PotentialAction,
  publisher: Guardian = Guardian(),
  isAccessibleForFree: Boolean = true,
  isPartOf: IsPartOf = IsPartOf(),
  image: Seq[String],
  author: String,
  datePublished: String,
  headline: String,
  dateModified: String,
) extends LinkedData(`@type`, `@context`)

object NewsArticle {
  def apply(
   `@id`: String,
    images: Seq[String],
    author: String,
    datePublished: String,
    headline: String,
    dateModified: String,
 ): NewsArticle = NewsArticle(
    "NewsArticle",
    "http://schema.org",
    `@id`,
    PotentialAction(
      target = s"android-app://com.guardian/${`@id`.replace("://", "/")}"
    ),
    image = images,
    author = author,
    headline = headline,
    datePublished = datePublished,
    dateModified = dateModified,
  )

  implicit val formats: OFormat[NewsArticle] = Json.format[NewsArticle]
}

case class PageData(
    author: String,
    pageId: String,
    pillar: Option[String],
    ajaxUrl: String,
    webPublicationDate: Long,
    webPublicationDateDisplay: String,
    section: Option[String],
    sectionLabel: String,
    sectionUrl: String,
    headline: String,
    webTitle: String,
    byline: String,
    contentId: Option[String],
    authorIds: Option[String],
    keywordIds: Option[String],
    toneIds: Option[String],
    seriesId: Option[String],
    isHosted: Boolean,
    beaconUrl: String,
    editionId: String,
    edition: String,
    contentType: Option[String],
    commissioningDesks: Option[String],
    subMetaLinks: SubMetaLinks,
    sentryHost: String,
    sentryPublicApiKey: String,
    switches: Map[String,Boolean],
    linkedData: NewsArticle,
    subscribeWithGoogleApiUrl: String,

    // AMP specific
    guardianBaseURL: String,
    webURL: String,
    shouldHideAds: Boolean,
    hasStoryPackage: Boolean,
    hasRelated: Boolean,
    isCommentable: Boolean,
    commercialProperties: Option[CommercialProperties],
    hasAffiliateLinks: Boolean,
    starRating: Option[Int],
)

case class Config(
    isImmersive: Boolean,
    page: PageData,
    nav: NavMenu,
    readerRevenueLinks: ReaderRevenueLinks
)

case class ContentFields(
    standfirst: Option[String],
    main: String,
    body: String,
    blocks: Blocks
)

/** Temporary stuff!! */

case class Tracking(ready: String)
case class Modules(tracking: Tracking)
case class Images(
     commercial: Map[String,String],
     acquisitions: Map[String,String],
     journalism: Map[String,String]
)
case class Font(kerningOn: String)
case class Fonts(
     hintingCleartype: Font,
     hintingOff: Font,
     hintingAuto: Font
)
case class Stylesheets(fonts: Fonts)
case class Trackers(
     editorialTest: String,
     editorialProd: String,
     editorial: String
)
case class GoogleAnalytics(
     trackers: Trackers,
     timingEvents: List[String]
)
case class Cmp(fullVendorDataUrl: String)
case class Libs(
     googletag: String,
     cmp: Cmp
)
case class GlobalJsConfig(
     page: PageData,
     navMenu: NavMenu,
     switches: Map[String,Boolean],
     tests: List[String], // Nope!
     modules: Modules,
     images: Images,
     stylesheets: Stylesheets,
     googleAnalytics: GoogleAnalytics,
     libs: Libs
)

/** Temporary stuff ends */

case class DotcomponentsDataModel(
    contentFields: ContentFields,
    config: Config,
    tags: List[Tag],
    globalJsConfig: GlobalJsConfig,
    version: Int
)

object Block {
  implicit val blockElementWrites: Writes[PageElement] = Json.writes[PageElement]
  implicit val writes = Json.writes[Block]
}

object Blocks {
  implicit val writes = Json.writes[Blocks]
}

object ContentFields {
  implicit val writes = Json.writes[ContentFields]
}

object TagProperties {
  implicit val writes = Json.writes[TagProperties]
}

object Tag {
  implicit val writes = Json.writes[Tag]
}

object ReaderRevenueLink {
  implicit val writes = Json.writes[ReaderRevenueLink]
}

object ReaderRevenueLinks {
  implicit val writes = Json.writes[ReaderRevenueLinks]
}

object PageData {
  // We use Jsonx here because PageData exceeds 22 fields and
  // regular Play JSON is unable to serialise this. See, e.g.
  //
  // * https://github.com/playframework/play-json/issues/3
  // * https://stackoverflow.com/questions/23571677/22-fields-limit-in-scala-2-11-play-framework-2-3-case-classes-and-functions/23588132#23588132
  implicit val formats = Jsonx.formatCaseClass[PageData]
}

object Config {
  implicit val writes = Json.writes[Config]
}

/** Temporary stuff!! */

object Tracking {
  implicit val writes = Json.writes[Tracking]
}
object Modules {
  implicit val writes = Json.writes[Modules]
}
object Images {
  implicit val writes = Json.writes[Images]
}
object Font {
  implicit val writes = Json.writes[Font]
}
object Fonts {
  implicit val writes = Json.writes[Fonts]
}
object Stylesheets {
  implicit val writes = Json.writes[Stylesheets]
}
object Trackers {
  implicit val writes = Json.writes[Trackers]
}
object GoogleAnalytics {
  implicit val writes = Json.writes[GoogleAnalytics]
}
object Cmp {
  implicit val writes = Json.writes[Cmp]
}
object Libs {
  implicit val writes = Json.writes[Libs]
}
object GlobalJsConfig {
  implicit val writes = Json.writes[GlobalJsConfig]
}

/** Temporary stuff ends */

object DotcomponentsDataModel {

  val VERSION = 1

  def fromArticle(articlePage: ArticlePage, request: RequestHeader): DotcomponentsDataModel = {

    val article = articlePage.article

    val bodyBlocks: List[Block] = article.blocks match {
      case Some(bs) => bs.body.map(bb => Block(bb.bodyHtml, bb.dotcomponentsPageElements.toList)).toList
      case None => List()
    }

    val mainBlock: Option[Block] = article.blocks.flatMap(
      _.main.map(bb=>Block(bb.bodyHtml, bb.dotcomponentsPageElements.toList))
    )

    val dcBlocks = Blocks(mainBlock, bodyBlocks)

    val contentFields = ContentFields(
      article.fields.standfirst,
      article.fields.main,
      article.fields.body,
      dcBlocks
    )

    val jsConfig = (k: String) => articlePage.getJavascriptConfig.get(k).map(_.as[String])


    val jsPageData = Configuration.javascript.pageData mapKeys { key =>
      CamelCase.fromHyphenated(key.split('.').lastOption.getOrElse(""))
    }

    val switches = conf.switches.Switches.all.filter(_.exposeClientSide).foldLeft(Map.empty[String,Boolean])( (acc, switch) => {
      acc + (CamelCase.fromHyphenated(switch.name) -> switch.isSwitchedOn)
    })


    // See https://developers.google.com/search/docs/data-types/article (and the AMP info too)
    // For example, we need to provide an image of at least 1200px width to be valid here
    val linkedData = {
      val mainImageURL = {
        val main = for {
          elem <- article.trail.trailPicture
          master <- elem.masterImage
          url <- master.url
        } yield url

        main.getOrElse(Configuration.images.fallbackLogo)
      }

      NewsArticle(
        `@id` = article.metadata.webUrl,
        images = Seq(ImgSrc(mainImageURL, Item1200)),
        author = article.tags.contributors.mkString(", "),
        datePublished = article.trail.webPublicationDate.toString(),
        dateModified = article.fields.lastModified.toString(),
        headline = article.trail.headline,
      )
    }

    val pageData = PageData(
      article.tags.contributors.map(_.name).mkString(","),
      article.metadata.id,
      article.metadata.pillar.map(_.toString),
      Configuration.ajax.url,
      article.trail.webPublicationDate.getMillis,
      GUDateTimeFormat.formatDateTimeForDisplay(article.trail.webPublicationDate, request),
      article.metadata.section.map(_.value),
      article.content.sectionLabelName,
      article.content.sectionLabelLink,
      article.trail.headline,
      article.metadata.webTitle,
      article.trail.byline.getOrElse(""),
      jsConfig("contentId"),   // source: content.scala
      jsConfig("authorIds"),   // source: meta.scala
      jsConfig("keywordIds"),  // source: tags.scala and meta.scala
      jsConfig("toneIds"),     // source: meta.scala
      jsConfig("seriesId"),    // source: content.scala
      article.metadata.isHosted,
      Configuration.debug.beaconUrl,
      Edition(request).id,
      Edition(request).displayName,
      jsConfig("contentType"),
      jsConfig("commissioningDesks"),
      article.content.submetaLinks,
      Configuration.rendering.sentryHost,
      Configuration.rendering.sentryPublicApiKey,
      switches,
      linkedData,
      Configuration.google.subscribeWithGoogleApiUrl,
      guardianBaseURL = Configuration.site.host,
      webURL = article.metadata.webUrl,
      shouldHideAds = article.content.shouldHideAdverts,
      hasStoryPackage = articlePage.related.hasStoryPackage,
      hasRelated = article.content.showInRelated,
      isCommentable = article.trail.isCommentable,
      article.metadata.commercial,
      article.content.fields.showAffiliateLinks.getOrElse(false),
      article.content.starRating
    )

    val tags = article.tags.tags.map(
      t => Tag(
        TagProperties(
          t.id,
          t.properties.tagType,
          t.properties.webTitle,
          t.properties.twitterHandle
        )
      )
    )

    val navMenu = NavMenu(articlePage, Edition(request))

    val headerReaderRevenueLink: ReaderRevenueLink = ReaderRevenueLink(
      getReaderRevenueUrl(SupportContribute, Header)(request),
      getReaderRevenueUrl(SupportSubscribe, Header)(request),
      getReaderRevenueUrl(Support, Header)(request)
    )

    val footerReaderRevenueLink: ReaderRevenueLink = ReaderRevenueLink(
      getReaderRevenueUrl(SupportContribute, Footer)(request),
      getReaderRevenueUrl(SupportSubscribe, Footer)(request),
      getReaderRevenueUrl(Support, Footer)(request)
    )

    val sideMenuReaderRevenueLink: ReaderRevenueLink = ReaderRevenueLink(
      getReaderRevenueUrl(SupportContribute, SideMenu)(request),
      getReaderRevenueUrl(SupportSubscribe, SideMenu)(request),
      getReaderRevenueUrl(Support, SideMenu)(request)
    )

    val ampHeaderReaderRevenueLink: ReaderRevenueLink = ReaderRevenueLink(
      getReaderRevenueUrl(SupportContribute, AmpHeader)(request),
      getReaderRevenueUrl(SupportSubscribe, AmpHeader)(request),
      getReaderRevenueUrl(Support, AmpHeader)(request)
    )

    val ampFooterReaderRevenueLink: ReaderRevenueLink = ReaderRevenueLink(
      getReaderRevenueUrl(SupportContribute, AmpFooter)(request),
      getReaderRevenueUrl(SupportSubscribe, AmpFooter)(request),
      getReaderRevenueUrl(Support, AmpFooter)(request)
    )

    val readerRevenueLinks = ReaderRevenueLinks(
      headerReaderRevenueLink,
      footerReaderRevenueLink,
      sideMenuReaderRevenueLink,
      ampHeaderReaderRevenueLink,
      ampFooterReaderRevenueLink
    )

    val config = Config(
      article.isImmersive,
      pageData,
      navMenu,
      readerRevenueLinks
    )

    val tests = List("") // this should be a Set of Experiments
    val modules = Modules(Tracking("")) // this should be null, but Scala
    val images = Images(
      Map(
        "ab-icon" -> Static("images/commercial/ab-icon.png"),
        "abp-icon" -> Static("images/commercial/abp-icon.png"),
        "abp-whitelist-instruction-chrome" -> Static("images/commercial/ad-block-instructions-chrome.png")
      ),
      Map(
        "paypal-and-credit-card" -> Static("images/acquisitions/paypal-and-credit-card.png"),
        "info-logo" -> Static("images/acquisitions/info-logo.svg"),
        "ad-free" -> Static("images/acquisitions/ad-free.svg")
      ),
      Map(
        "apple-podcast-logo"-> Static("images/journalism/apple-podcast-icon-48.png")
      )
    )
    val stylesheets = Stylesheets(
      Fonts(
        Font(Static("stylesheets/webfonts-hinting-cleartype-kerning-on.css")),
        Font(Static("stylesheets/webfonts-hinting-off-kerning-on.css")),
        Font(Static("stylesheets/webfonts-hinting-auto-kerning-on.css"))
      )
    )
    val trackers = Trackers(
      GoogleAnalyticsAccount.editorialTest.trackerName,
      GoogleAnalyticsAccount.editorialProd.trackerName,
      GoogleAnalyticsAccount.editorialProd.trackerName // hardcoded for now
    )
    val googleAnalytics = GoogleAnalytics(trackers, List())
    val libs = Libs(
      Configuration.javascript.config("googletagJsUrl"),
      Cmp(Static("data/vendor/cmp_vendorlist.json"))
    )
    val globalJsConfig = GlobalJsConfig(
      pageData,
      navMenu,
      switches,
      tests,
      modules,
      images,
      stylesheets,
      googleAnalytics,
      libs
    )

    DotcomponentsDataModel(
      contentFields,
      config,
      tags,
      globalJsConfig,
      VERSION
    )

  }

  def toJson(model: DotcomponentsDataModel): JsValue = {

    // make what we have look a bit closer to what dotcomponents currently expects

    implicit val DotComponentsDataModelWrites = new Writes[DotcomponentsDataModel] {
      def writes(model: DotcomponentsDataModel) = Json.obj(
        "config" -> model.config,
        "contentFields" -> Json.obj(
          "fields" -> model.contentFields
        ),
        "tags" -> Json.obj(
          "tags" -> model.tags
        ),
        "jsConfig" ->  model.globalJsConfig,
        "version" -> model.version
      )
    }

    Json.toJson(model)

  }


  def toJsonString(model: DotcomponentsDataModel): String = {
    Json.stringify(toJson(model))
  }

}
