/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/feed/tag/[tagName]/route";
exports.ids = ["app/api/feed/tag/[tagName]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/feed/tag/[tagName]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/feed/tag/[tagName]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/supabase/server */ \"(rsc)/./lib/supabase/server.ts\");\n\n\nasync function GET(request, { params }) {\n    try {\n        const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__.createClient)();\n        const { tagName } = await params;\n        const [baseTag, subtag] = tagName.split('.');\n        // Check authentication\n        const { data: { user }, error: authError } = await supabase.auth.getUser();\n        if (authError || !user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Unauthorized'\n            }, {\n                status: 401\n            });\n        }\n        // Get the user's profile\n        const { data: profile, error: profileError } = await supabase.from('User').select('user_id').eq('user_id', user.id).single();\n        if (profileError || !profile) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User profile not found'\n            }, {\n                status: 404\n            });\n        }\n        // Get the canonical tag ID\n        const { data: canonicalTag, error: tagError } = await supabase.from('CanonicalTag').select('tag_id').eq('name', baseTag).single();\n        if (tagError || !canonicalTag) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json([]);\n        }\n        // TODO: For now, we'll return stories from all users with this tag\n        // In the future, we'll implement a following system and filter by followed users\n        let storyQuery = supabase.from('Story').select(`\n        *,\n        author:User!Story_author_id_fkey(username, display_name),\n        user_tag:UserTag!inner(\n          *,\n          tag:CanonicalTag!inner(*)\n        )\n      `).eq('user_tag.tag.tag_id', canonicalTag.tag_id);\n        if (subtag) {\n            storyQuery = storyQuery.eq('subtag', subtag);\n        }\n        const { data: stories, error: storiesError } = await storyQuery.order('created_at', {\n            ascending: false\n        }).limit(50);\n        if (storiesError) {\n            console.error('Error fetching tag feed:', storiesError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Failed to fetch tag feed'\n            }, {\n                status: 500\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(stories || []);\n    } catch (error) {\n        console.error('Error in GET /api/feed/tag/[tagName]:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2ZlZWQvdGFnL1t0YWdOYW1lXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBd0Q7QUFDSDtBQUU5QyxlQUFlRSxJQUNwQkMsT0FBb0IsRUFDcEIsRUFBRUMsTUFBTSxFQUE0QztJQUVwRCxJQUFJO1FBQ0YsTUFBTUMsV0FBVyxNQUFNSixrRUFBWUE7UUFDbkMsTUFBTSxFQUFFSyxPQUFPLEVBQUUsR0FBRyxNQUFNRjtRQUUxQixNQUFNLENBQUNHLFNBQVNDLE9BQU8sR0FBR0YsUUFBUUcsS0FBSyxDQUFDO1FBRXhDLHVCQUF1QjtRQUN2QixNQUFNLEVBQUVDLE1BQU0sRUFBRUMsSUFBSSxFQUFFLEVBQUVDLE9BQU9DLFNBQVMsRUFBRSxHQUFHLE1BQU1SLFNBQVNTLElBQUksQ0FBQ0MsT0FBTztRQUN4RSxJQUFJRixhQUFhLENBQUNGLE1BQU07WUFDdEIsT0FBT1gscURBQVlBLENBQUNnQixJQUFJLENBQUM7Z0JBQUVKLE9BQU87WUFBZSxHQUFHO2dCQUFFSyxRQUFRO1lBQUk7UUFDcEU7UUFFQSx5QkFBeUI7UUFDekIsTUFBTSxFQUFFUCxNQUFNUSxPQUFPLEVBQUVOLE9BQU9PLFlBQVksRUFBRSxHQUFHLE1BQU1kLFNBQ2xEZSxJQUFJLENBQUMsUUFDTEMsTUFBTSxDQUFDLFdBQ1BDLEVBQUUsQ0FBQyxXQUFXWCxLQUFLWSxFQUFFLEVBQ3JCQyxNQUFNO1FBRVQsSUFBSUwsZ0JBQWdCLENBQUNELFNBQVM7WUFDNUIsT0FBT2xCLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO2dCQUFFSixPQUFPO1lBQXlCLEdBQUc7Z0JBQUVLLFFBQVE7WUFBSTtRQUM5RTtRQUVBLDJCQUEyQjtRQUMzQixNQUFNLEVBQUVQLE1BQU1lLFlBQVksRUFBRWIsT0FBT2MsUUFBUSxFQUFFLEdBQUcsTUFBTXJCLFNBQ25EZSxJQUFJLENBQUMsZ0JBQ0xDLE1BQU0sQ0FBQyxVQUNQQyxFQUFFLENBQUMsUUFBUWYsU0FDWGlCLE1BQU07UUFFVCxJQUFJRSxZQUFZLENBQUNELGNBQWM7WUFDN0IsT0FBT3pCLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDLEVBQUU7UUFDN0I7UUFFQSxtRUFBbUU7UUFDbkUsaUZBQWlGO1FBQ2pGLElBQUlXLGFBQWF0QixTQUNkZSxJQUFJLENBQUMsU0FDTEMsTUFBTSxDQUFDLENBQUM7Ozs7Ozs7TUFPVCxDQUFDLEVBQ0FDLEVBQUUsQ0FBQyx1QkFBdUJHLGFBQWFHLE1BQU07UUFFaEQsSUFBSXBCLFFBQVE7WUFDVm1CLGFBQWFBLFdBQVdMLEVBQUUsQ0FBQyxVQUFVZDtRQUN2QztRQUVBLE1BQU0sRUFBRUUsTUFBTW1CLE9BQU8sRUFBRWpCLE9BQU9rQixZQUFZLEVBQUUsR0FBRyxNQUFNSCxXQUNsREksS0FBSyxDQUFDLGNBQWM7WUFBRUMsV0FBVztRQUFNLEdBQ3ZDQyxLQUFLLENBQUM7UUFFVCxJQUFJSCxjQUFjO1lBQ2hCSSxRQUFRdEIsS0FBSyxDQUFDLDRCQUE0QmtCO1lBQzFDLE9BQU85QixxREFBWUEsQ0FBQ2dCLElBQUksQ0FBQztnQkFBRUosT0FBTztZQUEyQixHQUFHO2dCQUFFSyxRQUFRO1lBQUk7UUFDaEY7UUFFQSxPQUFPakIscURBQVlBLENBQUNnQixJQUFJLENBQUNhLFdBQVcsRUFBRTtJQUN4QyxFQUFFLE9BQU9qQixPQUFPO1FBQ2RzQixRQUFRdEIsS0FBSyxDQUFDLHlDQUF5Q0E7UUFDdkQsT0FBT1oscURBQVlBLENBQUNnQixJQUFJLENBQUM7WUFBRUosT0FBTztRQUF3QixHQUFHO1lBQUVLLFFBQVE7UUFBSTtJQUM3RTtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMva2V2aW5yb3NlL0xpYnJhcnkvQ2xvdWRTdG9yYWdlL0Ryb3Bib3gvdmliZS9kaWluby9hcHAvYXBpL2ZlZWQvdGFnL1t0YWdOYW1lXS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQC9saWIvc3VwYWJhc2Uvc2VydmVyJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChcbiAgcmVxdWVzdDogTmV4dFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiBQcm9taXNlPHsgdGFnTmFtZTogc3RyaW5nIH0+IH1cbikge1xuICB0cnkge1xuICAgIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgY3JlYXRlQ2xpZW50KCk7XG4gICAgY29uc3QgeyB0YWdOYW1lIH0gPSBhd2FpdCBwYXJhbXM7XG5cbiAgICBjb25zdCBbYmFzZVRhZywgc3VidGFnXSA9IHRhZ05hbWUuc3BsaXQoJy4nKTtcblxuICAgIC8vIENoZWNrIGF1dGhlbnRpY2F0aW9uXG4gICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IGF1dGhFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKCk7XG4gICAgaWYgKGF1dGhFcnJvciB8fCAhdXNlcikge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSB1c2VyJ3MgcHJvZmlsZVxuICAgIGNvbnN0IHsgZGF0YTogcHJvZmlsZSwgZXJyb3I6IHByb2ZpbGVFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCdVc2VyJylcbiAgICAgIC5zZWxlY3QoJ3VzZXJfaWQnKVxuICAgICAgLmVxKCd1c2VyX2lkJywgdXNlci5pZClcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmIChwcm9maWxlRXJyb3IgfHwgIXByb2ZpbGUpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGNhbm9uaWNhbCB0YWcgSURcbiAgICBjb25zdCB7IGRhdGE6IGNhbm9uaWNhbFRhZywgZXJyb3I6IHRhZ0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ0Nhbm9uaWNhbFRhZycpXG4gICAgICAuc2VsZWN0KCd0YWdfaWQnKVxuICAgICAgLmVxKCduYW1lJywgYmFzZVRhZylcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmICh0YWdFcnJvciB8fCAhY2Fub25pY2FsVGFnKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oW10pO1xuICAgIH1cblxuICAgIC8vIFRPRE86IEZvciBub3csIHdlJ2xsIHJldHVybiBzdG9yaWVzIGZyb20gYWxsIHVzZXJzIHdpdGggdGhpcyB0YWdcbiAgICAvLyBJbiB0aGUgZnV0dXJlLCB3ZSdsbCBpbXBsZW1lbnQgYSBmb2xsb3dpbmcgc3lzdGVtIGFuZCBmaWx0ZXIgYnkgZm9sbG93ZWQgdXNlcnNcbiAgICBsZXQgc3RvcnlRdWVyeSA9IHN1cGFiYXNlXG4gICAgICAuZnJvbSgnU3RvcnknKVxuICAgICAgLnNlbGVjdChgXG4gICAgICAgICosXG4gICAgICAgIGF1dGhvcjpVc2VyIVN0b3J5X2F1dGhvcl9pZF9ma2V5KHVzZXJuYW1lLCBkaXNwbGF5X25hbWUpLFxuICAgICAgICB1c2VyX3RhZzpVc2VyVGFnIWlubmVyKFxuICAgICAgICAgICosXG4gICAgICAgICAgdGFnOkNhbm9uaWNhbFRhZyFpbm5lcigqKVxuICAgICAgICApXG4gICAgICBgKVxuICAgICAgLmVxKCd1c2VyX3RhZy50YWcudGFnX2lkJywgY2Fub25pY2FsVGFnLnRhZ19pZCk7XG5cbiAgICBpZiAoc3VidGFnKSB7XG4gICAgICBzdG9yeVF1ZXJ5ID0gc3RvcnlRdWVyeS5lcSgnc3VidGFnJywgc3VidGFnKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGE6IHN0b3JpZXMsIGVycm9yOiBzdG9yaWVzRXJyb3IgfSA9IGF3YWl0IHN0b3J5UXVlcnlcbiAgICAgIC5vcmRlcignY3JlYXRlZF9hdCcsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxuICAgICAgLmxpbWl0KDUwKTtcblxuICAgIGlmIChzdG9yaWVzRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHRhZyBmZWVkOicsIHN0b3JpZXNFcnJvcik7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCB0YWcgZmVlZCcgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oc3RvcmllcyB8fCBbXSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gR0VUIC9hcGkvZmVlZC90YWcvW3RhZ05hbWVdOicsIGVycm9yKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxufSAiXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiY3JlYXRlQ2xpZW50IiwiR0VUIiwicmVxdWVzdCIsInBhcmFtcyIsInN1cGFiYXNlIiwidGFnTmFtZSIsImJhc2VUYWciLCJzdWJ0YWciLCJzcGxpdCIsImRhdGEiLCJ1c2VyIiwiZXJyb3IiLCJhdXRoRXJyb3IiLCJhdXRoIiwiZ2V0VXNlciIsImpzb24iLCJzdGF0dXMiLCJwcm9maWxlIiwicHJvZmlsZUVycm9yIiwiZnJvbSIsInNlbGVjdCIsImVxIiwiaWQiLCJzaW5nbGUiLCJjYW5vbmljYWxUYWciLCJ0YWdFcnJvciIsInN0b3J5UXVlcnkiLCJ0YWdfaWQiLCJzdG9yaWVzIiwic3Rvcmllc0Vycm9yIiwib3JkZXIiLCJhc2NlbmRpbmciLCJsaW1pdCIsImNvbnNvbGUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/feed/tag/[tagName]/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabase/server.ts":
/*!********************************!*\
  !*** ./lib/supabase/server.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createClient: () => (/* binding */ createClient)\n/* harmony export */ });\n/* harmony import */ var _barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! __barrel_optimize__?names=createServerClient!=!@supabase/ssr */ \"(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n\n\nasync function createClient() {\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    return (0,_barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__.createServerClient)(\"https://zinencmbqximkrqfkjol.supabase.co\", \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbmVuY21icXhpbWtycWZram9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjYyMjIsImV4cCI6MjA2NzQwMjIyMn0.RBrnl_ksL9DHISglmeFKOicMlS9czl8xdgAKF7wHyxQ\", {\n        cookies: {\n            getAll () {\n                return cookieStore.getAll();\n            },\n            setAll (cookiesToSet) {\n                try {\n                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));\n                } catch  {\n                // The `setAll` method was called from a Server Component.\n                // This can be ignored if you have middleware refreshing\n                // user sessions.\n                }\n            }\n        },\n        auth: {\n            debug: \"development\" === 'development'\n        },\n        db: {\n            schema: 'public'\n        },\n        global: {\n            headers: {\n                'x-client-info': 'diino-server'\n            }\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2Uvc2VydmVyLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFrRDtBQUNaO0FBRS9CLGVBQWVFO0lBQ3BCLE1BQU1DLGNBQWMsTUFBTUYscURBQU9BO0lBRWpDLE9BQU9ELDBHQUFrQkEsQ0FDdkJJLDBDQUFvQyxFQUNwQ0Esa05BQXlDLEVBQ3pDO1FBQ0VILFNBQVM7WUFDUE87Z0JBQ0UsT0FBT0wsWUFBWUssTUFBTTtZQUMzQjtZQUNBQyxRQUFPQyxZQUFZO2dCQUNqQixJQUFJO29CQUNGQSxhQUFhQyxPQUFPLENBQUMsQ0FBQyxFQUFFQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxFQUFFLEdBQzVDWCxZQUFZWSxHQUFHLENBQUNILE1BQU1DLE9BQU9DO2dCQUVqQyxFQUFFLE9BQU07Z0JBQ04sMERBQTBEO2dCQUMxRCx3REFBd0Q7Z0JBQ3hELGlCQUFpQjtnQkFDbkI7WUFDRjtRQUNGO1FBQ0FFLE1BQU07WUFDSkMsT0FBT2Isa0JBQXlCO1FBQ2xDO1FBQ0FjLElBQUk7WUFDRkMsUUFBUTtRQUNWO1FBQ0FDLFFBQVE7WUFDTkMsU0FBUztnQkFDUCxpQkFBaUI7WUFDbkI7UUFDRjtJQUNGO0FBRUoiLCJzb3VyY2VzIjpbIi9Vc2Vycy9rZXZpbnJvc2UvTGlicmFyeS9DbG91ZFN0b3JhZ2UvRHJvcGJveC92aWJlL2RpaW5vL2xpYi9zdXBhYmFzZS9zZXJ2ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU2VydmVyQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3NzcidcbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tICduZXh0L2hlYWRlcnMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVDbGllbnQoKSB7XG4gIGNvbnN0IGNvb2tpZVN0b3JlID0gYXdhaXQgY29va2llcygpXG5cbiAgcmV0dXJuIGNyZWF0ZVNlcnZlckNsaWVudChcbiAgICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhLFxuICAgIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZISxcbiAgICB7XG4gICAgICBjb29raWVzOiB7XG4gICAgICAgIGdldEFsbCgpIHtcbiAgICAgICAgICByZXR1cm4gY29va2llU3RvcmUuZ2V0QWxsKClcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QWxsKGNvb2tpZXNUb1NldCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb29raWVzVG9TZXQuZm9yRWFjaCgoeyBuYW1lLCB2YWx1ZSwgb3B0aW9ucyB9KSA9PlxuICAgICAgICAgICAgICBjb29raWVTdG9yZS5zZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBUaGUgYHNldEFsbGAgbWV0aG9kIHdhcyBjYWxsZWQgZnJvbSBhIFNlcnZlciBDb21wb25lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiBiZSBpZ25vcmVkIGlmIHlvdSBoYXZlIG1pZGRsZXdhcmUgcmVmcmVzaGluZ1xuICAgICAgICAgICAgLy8gdXNlciBzZXNzaW9ucy5cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYXV0aDoge1xuICAgICAgICBkZWJ1ZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCdcbiAgICAgIH0sXG4gICAgICBkYjoge1xuICAgICAgICBzY2hlbWE6ICdwdWJsaWMnXG4gICAgICB9LFxuICAgICAgZ2xvYmFsOiB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAneC1jbGllbnQtaW5mbyc6ICdkaWluby1zZXJ2ZXInXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIClcbn0iXSwibmFtZXMiOlsiY3JlYXRlU2VydmVyQ2xpZW50IiwiY29va2llcyIsImNyZWF0ZUNsaWVudCIsImNvb2tpZVN0b3JlIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwiZ2V0QWxsIiwic2V0QWxsIiwiY29va2llc1RvU2V0IiwiZm9yRWFjaCIsIm5hbWUiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJzZXQiLCJhdXRoIiwiZGVidWciLCJkYiIsInNjaGVtYSIsImdsb2JhbCIsImhlYWRlcnMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabase/server.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&page=%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&page=%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_feed_tag_tagName_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/feed/tag/[tagName]/route.ts */ \"(rsc)/./app/api/feed/tag/[tagName]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/feed/tag/[tagName]/route\",\n        pathname: \"/api/feed/tag/[tagName]\",\n        filename: \"route\",\n        bundlePath: \"app/api/feed/tag/[tagName]/route\"\n    },\n    resolvedPagePath: \"/Users/kevinrose/Library/CloudStorage/Dropbox/vibe/diino/app/api/feed/tag/[tagName]/route.ts\",\n    nextConfigOutput,\n    userland: _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_feed_tag_tagName_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZmZWVkJTJGdGFnJTJGJTVCdGFnTmFtZSU1RCUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZmVlZCUyRnRhZyUyRiU1QnRhZ05hbWUlNUQlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZmZWVkJTJGdGFnJTJGJTVCdGFnTmFtZSU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUM0QztBQUN6SDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL2tldmlucm9zZS9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9Ecm9wYm94L3ZpYmUvZGlpbm8vYXBwL2FwaS9mZWVkL3RhZy9bdGFnTmFtZV0vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2ZlZWQvdGFnL1t0YWdOYW1lXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2ZlZWQvdGFnL1t0YWdOYW1lXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvZmVlZC90YWcvW3RhZ05hbWVdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2tldmlucm9zZS9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9Ecm9wYm94L3ZpYmUvZGlpbm8vYXBwL2FwaS9mZWVkL3RhZy9bdGFnTmFtZV0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&page=%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js":
/*!********************************************************************************************************!*\
  !*** __barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createServerClient: () => (/* reexport safe */ _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_node_modules_supabase_ssr_dist_module_createServerClient_js__WEBPACK_IMPORTED_MODULE_0__.createServerClient)\n/* harmony export */ });\n/* harmony import */ var _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_node_modules_supabase_ssr_dist_module_createServerClient_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@supabase/ssr/dist/module/createServerClient.js */ \"(rsc)/./node_modules/@supabase/ssr/dist/module/createServerClient.js\");\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvX19iYXJyZWxfb3B0aW1pemVfXz9uYW1lcz1jcmVhdGVTZXJ2ZXJDbGllbnQhPSEuL25vZGVfbW9kdWxlcy9Ac3VwYWJhc2Uvc3NyL2Rpc3QvbW9kdWxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQ3FDIiwic291cmNlcyI6WyIvVXNlcnMva2V2aW5yb3NlL0xpYnJhcnkvQ2xvdWRTdG9yYWdlL0Ryb3Bib3gvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?32c4":
/*!****************************!*\
  !*** bufferutil (ignored) ***!
  \****************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/ws","vendor-chunks/whatwg-url","vendor-chunks/cookie","vendor-chunks/webidl-conversions","vendor-chunks/isows"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&page=%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ffeed%2Ftag%2F%5BtagName%5D%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();