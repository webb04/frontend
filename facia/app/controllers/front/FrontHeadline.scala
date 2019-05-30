package controllers.front

import common.Logging
import model.Cached.{RevalidatableResult, WithoutRevalidationResult}
import model.{Cached, PressedPage}
import model.pressed.LinkSnap
import play.api.mvc.Results

object FrontHeadline extends Results with Logging {

  val headlineNotFound: Cached.CacheableResult = WithoutRevalidationResult(NotFound("Could not extract headline from front"))

  def renderEmailHeadline(faciaPage: PressedPage): Cached.CacheableResult = {
    val headline = for {
      topCollection <- faciaPage.collections.headOption
      topCurated <- topCollection.curatedPlusBackfillDeduplicated.headOption

    } yield {
      RevalidatableResult.Ok(topCurated match {
        case _: LinkSnap => topCurated.header.headline
        case _ => topCurated.properties.webTitle
      })
    }

    headline.
      getOrElse {
        log.warn(s"headline not found for ${faciaPage.id}")
        headlineNotFound
      }

  }
}
