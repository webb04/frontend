package views.support

import com.gu.commercial.display.AdTargetParam.toMap
import common.Edition
import common.Maps.RichMap
import common.commercial.EditionAdTargeting._
import conf.Configuration.environment
import conf.switches.Switches.prebidSwitch
import conf.{Configuration, DiscussionAsset}
import model._
import play.api.libs.json._

object JavaScriptPage {

  def get(page: Page, edition: Edition, isPreview: Boolean): JsValue = Json.toJson(getMap(page, edition, isPreview))

  def getMap(page: Page, edition: Edition, isPreview: Boolean): Map[String,JsValue] = {
    val metaData = page.metadata
    val content: Option[Content] = Page.getContent(page).map(_.content)

    val pageData = Configuration.javascript.pageData mapKeys { key =>
      CamelCase.fromHyphenated(key.split('.').lastOption.getOrElse(""))
    }

    val config = (Configuration.javascript.config ++ pageData).mapValues(JsString.apply)
    val sponsorshipType = for {
      commercial <- page.metadata.commercial
      branding <- commercial.branding(edition)
    } yield "sponsorshipType" -> JsString(branding.brandingType.name)
    val allowUserGeneratedContent = content.exists(_.allowUserGeneratedContent)
    val requiresMembershipAccess = content.exists(_.metadata.requiresMembershipAccess)
    val membershipAccess = content.flatMap(_.metadata.membershipAccess).getOrElse("")

    val cardStyle = content.map(_.cardStyle.toneString).getOrElse("")

    val nonRefreshableLineItemIds: JsArray = {
      val ids: Seq[Long] = metaData.commercial.map(_.nonRefreshableLineItemIds) getOrElse Nil
      JsArray(ids map (id => JsNumber(id)))
    }

    val commercialMetaData = Map(
      "dfpHost" -> JsString("pubads.g.doubleclick.net"),
      "hasPageSkin" -> JsBoolean(metaData.hasPageSkin(edition)),
      "dfpNonRefreshableLineItemIds" -> nonRefreshableLineItemIds,
      "shouldHideAdverts" -> JsBoolean(page match {
        case c: ContentPage if c.item.content.shouldHideAdverts => true
        case _: CommercialExpiryPage => true
        case _ => false
      }),
      "sharedAdTargeting" -> Json.toJson(toMap(metaData.commercial.map(_.adTargeting(edition)) getOrElse Set.empty)),
      "pbIndexSites" -> Json.toJson(metaData.commercial.flatMap(_.prebidIndexSites).getOrElse(Set.empty)),
      "hbImpl" -> {
        if (prebidSwitch.isSwitchedOn) JsString("prebid")
        else JsString("none")
      },
      "isSensitive" -> JsBoolean(page.metadata.sensitive)
    ) ++ sponsorshipType

    val journalismMetaData = Map(
      "calloutsUrl" -> JsString(Configuration.journalism.calloutsUrl)
    )

    val javascriptConfig = page match {
      case c: ContentPage => c.getJavascriptConfig
      case s: StandalonePage => s.getJavascriptConfig
      case _ => Map()
    }

    javascriptConfig ++ config ++ commercialMetaData ++ journalismMetaData ++ Map(
      ("edition", JsString(edition.id)),
      ("ajaxUrl", JsString(Configuration.ajax.url)),
      ("isDev", JsBoolean(!environment.isProd)),
      ("isProd", JsBoolean(Configuration.environment.isProd)),
      ("idUrl", JsString(Configuration.id.url)),
      ("mmaUrl", JsString(Configuration.id.mmaUrl)),
      ("beaconUrl", JsString(Configuration.debug.beaconUrl)),
      ("assetsPath", JsString(Configuration.assets.path)),
      ("isPreview", JsBoolean(isPreview)),
      ("allowUserGeneratedContent", JsBoolean(allowUserGeneratedContent)),
      ("requiresMembershipAccess", JsBoolean(requiresMembershipAccess)),
      ("membershipAccess", JsString(membershipAccess)),
      ("idWebAppUrl", JsString(Configuration.id.oauthUrl)),
      ("cardStyle", JsString(cardStyle)),
      ("discussionFrontendUrl", JsString(DiscussionAsset("discussion-frontend.preact.iife")))
    )
  }
}
