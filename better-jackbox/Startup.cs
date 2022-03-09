using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SignalRTest
{
    public class Startup
    {
        private readonly List<WebSocket> sockets = new List<WebSocket>();

        public void ConfigureServices(IServiceCollection services)
        {
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseWebSockets(new WebSocketOptions()
            {
                KeepAliveInterval = TimeSpan.FromSeconds(60),
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.Map("/ws", async context =>
                {
                    byte[] buffer = new byte[1024 * 4];
                    WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    sockets.Add(webSocket);

                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    int i = 0;
                    while (result.CloseStatus != null)
                    {
                        i++;
                        var message = Encoding.UTF8.GetBytes($"Test message #{i}");
                        foreach (var socket in sockets)
                        {
                            await socket.SendAsync(new ArraySegment<byte>(message, 0, message.Length), result.MessageType, result.EndOfMessage, CancellationToken.None);
                        }

                        await Task.Delay(TimeSpan.FromSeconds(3));
                    }
                });
            });
        }
    }
}
